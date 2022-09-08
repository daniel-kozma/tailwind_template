const fs = require("fs")
const { join } = require("path")

const cssFilePaths = process.argv.slice(2)

function execCommand(command) {
    const { exec } = require("child_process")
    return new Promise((res, rej) => {
        exec(command, (err, stdout, stderr) => {
            if(err)return rej(err)
            res(stdout)
        })
    })
}

let fsTimeout

fs.watch("./src", (e, filename) => {
    if (fsTimeout)return
    fsTimeout = setTimeout(function() { fsTimeout=null }, 100)
    cssFilePaths.forEach(pathName => {
        console.log(`Compiling ${pathName}`)
        execCommand(
            `npx tailwindcss -i ${join("./src", pathName)} -o ${join("./public", pathName)}`
        ).then(stdout => console.log(`Compiled ${pathName}`))
    })
    fs.cp("./src", "./public", {
        recursive: true,
        force: false
    }, err => {if(err){throw err}})
})


// local server setup
const http = require("http")
const url = require("url")
// const fs = require("fs")
const path = require("path")
const port = 3500
const publicDir = "./public"

http.createServer(function (req, res) {
  // console.log(`${req.method} ${req.url}`)

  // parse URL
  const parsedUrl = url.parse(req.url)
  // extract URL path
  let pathname = `${publicDir}${parsedUrl.pathname}`
  // based on the URL path, extract the file extension. e.g. .js, .doc, ...
  const ext = path.parse(pathname).ext || ".html"
  // maps file extension to MIME typere
  const map = {
    ".ico": "image/x-icon",
    ".html": "text/html",
    ".js": "text/javascript",
    ".json": "application/json",
    ".css": "text/css",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".wav": "audio/wav",
    ".mp3": "audio/mpeg",
    ".svg": "image/svg+xml",
    ".pdf": "application/pdf",
    ".doc": "application/msword"
  }

  fs.exists(pathname, function (exist) {
    if(!exist) {
      // if the file is not found, return 404
      res.statusCode = 404
      res.end(`File ${pathname} not found!`)
      return
    }

    // if is a directory search for index file matching the extension
    if (fs.statSync(pathname).isDirectory()) pathname += "/index" + ext

    // read file from file system
    fs.readFile(pathname, function(err, data){
      if(err){
        res.statusCode = 500
        res.end(`Error getting the file: ${err}.`)
      } else {
        // if the file is found, set Content-type and send data
        res.setHeader("Content-type", map[ext] || "text/plain" )
        res.end(data)
      }
    })
  })


}).listen(parseInt(port))

console.log(`Server listening at http://localhost:${port}`)
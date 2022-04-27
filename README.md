# eleventy-img-helper
`eleventy-img-helper` is an [Eleventy](https://11ty.dev) plugin that makes use of the 
[`eleventy-img`](https://www.11ty.dev/docs/plugins/image/) utility to generate responsive images in Eleventy HTML
output, regardless of the template language used. It takes the same options as `eleventy-img`, but with a few extras:
- `htmlFunction`: Is `eleventy-img`'s `generateHTML` function not versatile enough for you? Pass in a custom function to
  generate the HTML exactly the way you want. The following pieces of data will be provided:
  - `metadata`: The result of invoking `eleventy-img` on an image, containing the metadata describing the new images.
  - `options`: The options applied to this image. This is most useful for adding `options.sizes` to your HTML.
  - `attributes`: The attributes that were on the original `<img>` tag.
- `postFunction`: A function to run on the processed HTML before returning it. This is most useful for things like HTML
  minification or other small transforms.
- `selectors`: Probably the highlight feature of this plugin, this option is an object containing a list of CSS
  selectors paired with another set of options. These selector-specific options will be merged with the global ones,
  overriding any that already existed. Any options can be used in either a global or selector-specific context, but only
  1 selector should apply to each image in the document currently. Additionally, `postFunction` will have no effect when
  in selector-specific options.

## Installation
```
npm install --save-dev eleventy-img-helper
```

## Usage
Add the plugin to your `.eleventy.js`:
```js
const imgOptPlugin = require("eleventy-img-helper");

module.exports = function (eleventyConfig) {
  const imgOptConfig = {
    ...configuration goes here
  }
  eleventyConfig.addPlugin(imgOptPlugin, imgOptConfig);
}
```

## A complex configuration example
```js
const imgOptConfig = {
  formats: ["avif", "webp", "jpeg"],
  filenameFormat: (id, src, width, format) => {
    let filename = path.basename(src, path.extname(src));
    return `${filename}-${width}.${format}`
  },
  selectors: {
    "img.headerImg": {
      widths: [720, 1440, 2560],
      sizes: "100vw",
      htmlFunction: (metadata, options, attributes) => {
        let newImgAttrs = {
          src: metadata.jpeg[0].url,
          loading: "lazy",
          decoding: "async"
        };
        return `<picture>
          ${Object.values(metadata).map(imageFormat => {
            return `<source
              type="${imageFormat[0].sourceType}"
              srcset="${imageFormat.map(entry => entry.srcset).join(", ")}"
              sizes="${options.sizes}">`;
          }).join("\n")}
            <img ${Object.entries({...attributes, ...newImgAttrs}).map(attr => `${attr[0]}="${attr[1]}"`).join(" ")}>
          </picture>`;
      }
    },
    "article img": {
      widths: [448, 672, 872],
      sizes: "(min-width: 896px) 872px, 100vw"
    }
  },
  postFunction: (inputContent) => {
    if (process.env.NODE_ENV === "prod") {
      return htmlmin.minify(inputContent, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true
      })
    }
    return inputContent;
  }
}
```

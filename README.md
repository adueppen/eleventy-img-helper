# eleventy-img-helper
`eleventy-img-helper` is an [Eleventy](https://11ty.dev) plugin that makes use of the 
[`eleventy-img`](https://www.11ty.dev/docs/plugins/image/) utility to generate responsive images in Eleventy HTML
output, regardless of the template language used. It takes the same options as `eleventy-img`, but with a few extras:
- `sizes`: Directly specify the source size descriptors to be put in the `sizes` attribute in the resulting HTML.
- `htmlFunction`: Is `eleventy-img`'s `generateHTML` function not versatile enough for you? Pass in a custom function to
  generate the HTML exactly the way you want. The following pieces of data will be provided:
  - `metadata`: The result of invoking `eleventy-img` on an image, containing the metadata describing the new images.
  - `options`: The options applied to this image. This is most useful for adding `options.sizes` to your HTML.
  - `attributes`: The attributes that were on the original `<img>` tag.
- `postFunction`: A function to run on the processed HTML before returning it. This is most useful for things like HTML
  minification or other small transforms.
- `selectors`: The highlight feature of this plugin, this option is an object containing a list of CSS selectors paired
  with another set of `eleventy-img`/plugin options. For each `<img>` tag in the input content, the selectors that apply
  to it will have their options merged with the global options and then each other in order of CSS specificity.
  - In other words, the selector-specific options will emulate the CSS cascade in a very basic form, with the global
    options having the least specificity.
  - Note: `postFunction` will have no effect when in selector-specific options.

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

## A complex configuration example (with a few notes)
```js
const imgOptConfig = {
  formats: ["avif", "webp", "jpeg"],
  hashLength: 4,
  filenameFormat: (id, src, width, format) => {
    let filename = path.basename(src, path.extname(src)).split("-")[0];
    return `${filename}-${id}-${width}.${format}`
  },
  sharpAvifOptions: { //supports all of the options in eleventy-img, even the niche ones
    quality: 75
  },
  selectors: {
    ".headerImg": { //use any selector, as long as it matches <img> tags (doesn't have to explicitly specify them)
      widths: [720, 1440, 2160],
      sizes: "100vw",
      htmlFunction: (metadata, options, attributes) => { //custom HTML tag generation
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
      widths: [720, 1080],
      sizes: "(min-width: 744px) 720px, 100vw"
    },
    "img[data-nl]": {
      formats: ["webp", "png"], //overriding global format option above
      sharpWebpOptions: {
        nearLossless: true,
        quality: 50
      },
    }
  },
  postFunction: (inputContent) => { //optional post function, HTML minification in this case
    if (process.env.NODE_ENV === "prod") {
      return htmlmin.minify(inputContent, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true
      })
    }
    return inputContent;
  }
};
```

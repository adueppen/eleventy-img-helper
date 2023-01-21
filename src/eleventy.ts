import transform, {HelperOptions} from "./transform";

type TransformThis = { inputPath: string, outputPath: string };
type TransformCallback = (this: TransformThis, inputContent: string) => string | Promise<string>;
type AddTransform = (name: string, callback: TransformCallback) => void;

export = (eleventyConfig: {addTransform: AddTransform}, options: HelperOptions) => {
  eleventyConfig.addTransform("responsive-images", async function (inputContent) {
    if (this.outputPath && this.outputPath.endsWith(".html")) {
      let processed = transform(inputContent, options, this.inputPath, this.outputPath);
      return processed.then(value => options.postFunction ? options.postFunction(value) : value);
    }
    return inputContent;
  })
}

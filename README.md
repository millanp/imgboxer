# imgboxer
A tool to quickly highlight and tag portions of images (REQUIRES CHROME)

**The concept**<br>
This is a system to add "tags" to certain regions of input images, then output the tag names and locations in a JSON file. It is designed to be used quickly, with fast image loading and keyboard shortcuts.

**Instructions for use**<br>
1. Put all input images under a single directory. Must contain image files only, but subdirectories are allowed.<br>
2. Create a .labels file somewhere within this directory. This is a newline separated list of tags that may be applied to different sections of the images.<br>
3. Go to http://millanp.github.io/imgboxer to use the tool. If you want to download it for offline use, clone this repository to your machine and open index.html in Chrome.<br>
4. When you come to a stopping point, return to the boxing view and click "Get download link". A link will appear that will allow you to download a file named data.json that contains all of the information about the tagged regions.<br>
5. If you want to pick up where you left off, make sure to select your previously generated data.json using the "Choose tag data file" button when you open up the tool again.<br>

**Data file format**<br>
See https://github.com/millanp/imgboxer/blob/master/example_data.json for an example data.json file.

The format is as follows:

```
{
  "0": {
    "name": "<filename of first image>",
    "rects": [
      {
        "top": <pixels from top of image to top of rectangle>,
        "left": <pixels from left side of image to left side of rectangle>,
        "width": <width in pixels of rectangle>,
        "height": <height in pixels of rectangle>,
        "tag": <tag applied to rectangle; for example, "Cat" or "Dog">
      },
      ... repeated for each rectangle drawn over the first image
    ]
  },
  ...
  "<number of images - 1>": {
    ...
  },
  "imageCount": <number of images in the selected directory>
  "currentImage": "<filename of the image that was displayed when the download button was clicked, for purposes of picking up where you left off>"
}
```

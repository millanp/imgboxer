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

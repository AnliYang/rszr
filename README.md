# RSZR
#### Service for requesting raw and resized images.

## To run RSZR locally:
* clone the repo: `git clone https://github.com/AnliYang/rszr.git`
* switch into the directory: `cd rszr`
* match node versions: `nvm use`
* install dependencies: `npm install`
* start it up: `npm run dev` (uses nodemon to watch for file changes)
...And now (I hope!) you've got rszr running: http://localhost:3000/

## Using RSZR:
The raw images are stored in [static/raw](https://github.com/AnliYang/rszr/tree/master/static/raw).

To access a raw image, hit `/raw` and provide the image name:
`/raw/<IMAGE-FILE-NAME>`
e.g., http://localhost:3000/raw/cheese-cake.jpg

To access a resized image, hit `/resized`, provide the image name, and the desired width/height dimensions (in px):
`/raw/<IMAGE-FILE-NAME>_<WIDTH>x<HEIGHT>`
e.g., http://localhost:3000/resized/cheese-cake_200x300.jpg,
http://localhost:3000/resized/cheese-cake_300x300.jpg,
http://localhost:3000/resized/cheese-cake_400x200.jpg

## To add for dev:
* linter

## Bugs and To Do's:
* Handle gifs. Currently able to serve raw gifs, but resizing results in what appears to be just one frame from the gif (resized).
* Add more helpful errors for helping users who submit malformed requests.
* Pull all resizing out into a separate module, keeping in mind that I'm likely to use a different library to process gif resizing.
* The image quality seems to be pretty compromised when resizing. Look into different settings with the current library, and other options.

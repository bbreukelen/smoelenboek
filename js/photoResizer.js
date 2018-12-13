/*
* Created by Boudewijn van Breukelen at Dec 3rd 2018
* Finds photos and replaces them with canvases to reduce document size drastically
*/

function resizePhotos() {
  [].forEach.call(document.getElementsByTagName("canvas"), function (canvas) {
    if (canvas.scrollWidth && canvas.scrollWidth !== canvas.width) canvas.width = canvas.scrollWidth;
    if (canvas.scrollHeight && canvas.scrollHeight !== canvas.heigth) canvas.height = canvas.scrollHeight;

    var w = canvas.width,
      h = canvas.height,
      ctx = canvas.getContext('2d');

    var img = new Image();
    img.onload = function () {
      var iw = img.width,
        ih = img.height,
        r = Math.min(w / iw, h / ih),
        nw = iw * r,   // new prop. width
        nh = ih * r,   // new prop. height
        cx, cy, cw, ch, ar = 1;

      var iw = img.width,
        ih = img.height,
        r = Math.min(w / iw, h / ih),
        nw = iw * r,   // new prop. width
        nh = ih * r,   // new prop. height
        cx, cy, cw, ch, ar = 1;

      // decide which gap to fill
      if (nw < w) ar = w / nw;
      if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh;  // updated
      nw *= ar;
      nh *= ar;

      // calc source rectangle
      cw = iw / (nw / w);
      ch = ih / (nh / h);

      cx = (iw - cw) * 0.5;
      cy = (ih - ch) * 0.5;

      // make sure source rectangle is valid
      if (cx < 0) cx = 0;
      if (cy < 0) cy = 0;
      if (cw > iw) cw = iw;
      if (ch > ih) ch = ih;

      // fill image in dest. rectangle
      ctx.drawImage(img, cx, cy, cw, ch,  0, 0, w, h);
    };

    img.onerror = function() {
      var backup = canvas.getAttribute('data-src-backup');
      if (backup && img.src !== backup)
        img.src = backup;
    };

    img.src = canvas.getAttribute('data-src');
  });
}

resizePhotos();
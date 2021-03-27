var _____WB$wombat$assign$function_____ = function(name) {return (self._wb_wombat && self._wb_wombat.local_init && self._wb_wombat.local_init(name)) || self[name]; };
if (!self.__WB_pmw) { self.__WB_pmw = function(obj) { this.__WB_source = obj; return this; } }
{
  let window = _____WB$wombat$assign$function_____("window");
  let self = _____WB$wombat$assign$function_____("self");
  let document = _____WB$wombat$assign$function_____("document");
  let location = _____WB$wombat$assign$function_____("location");
  let top = _____WB$wombat$assign$function_____("top");
  let parent = _____WB$wombat$assign$function_____("parent");
  let frames = _____WB$wombat$assign$function_____("frames");
  let opener = _____WB$wombat$assign$function_____("opener");

/*
  Author: Chris Shier, http://csh.bz
  Date: September 7th, 2013

|---------------------------------------------------------------------------|
|                                  Controls                                 |
|---------------------------------------------------------------------------|
| Desktop    |      Touch       |                  Effect                   |
|------------|------------------|-------------------------------------------|
| `Click`    | Two Finger Tap   | Cycle Brush Type (Path, Wide, Circle)     |
| `1 2 3`    | Three Finger Tap | Change Color (Countercolor, Rainbow, B&W) |
| `W`        | Four Finger Tap  | Invert Canvas Colors                      |
| `Spacebar` | n/a              | Toggle Canvas Smoothing (Smooth/Pixel)    |
| `G`        | n/a              | Generate Animated GIF                     |
| `P`        | n/a              | Generate Static PNG                       |
| `R`        | n/a              | Invert & Threshold                        |
| `D`        | n/a              | Invert & Banding                          |
| `C`        | n/a              | Start WebCam                              |
|---------------------------------------------------------------------------|
 */
var PI, animloop, between, brush_mode, camsPainted, color_mode, compare, connected, cos, cycle, decay, distance, dither, dot, drawLine, drawLine1, drawLine2, drawLine3, edgePaint, flatten, fps, fpsFilter, fps_now, gif_canvas, gif_captureCanvas, gif_ctx, greyscale, hsla, i, imageSmoothing, initCam, initCanvas, invert, keyPress, killCam, lastUpdate, last_zoom, match, me, mean, overlay, paintCam, rainbow, rgba, scaled_count, sin, sizeCanvas, sizeCanvasesToWindow, smoothing_bool, socket, storeCanvas, threshold, uDLine1, uDLine2, uDLine3, uDPoints, userData, v_canvas, v_ctx, webcam_modes, webcam_running, webcam_status, x_mean, x_old, y_mean, y_old, zoom, _i;

PI = Math.PI;

userData = [];

me = [null, 500, 500, 0];

connected = false;

x_mean = 0;

y_mean = 0;

x_old = [];

y_old = [];

uDPoints = [];

color_mode = 0;

brush_mode = 0;

smoothing_bool = true;

fps = 0;

fps_now = null;

lastUpdate = Date.now() * 1 - 1;

fpsFilter = 50;

zoom = 1;

last_zoom = 1;

scaled_count = 0;

initCanvas = function() {
  window.canvas = document.getElementById('canvas');
  window.ctx = canvas.getContext('2d');
  sizeCanvasesToWindow(null, 1);
  window.addEventListener('resize', sizeCanvasesToWindow, false);
  return window.addEventListener('onorientationchange', sizeCanvasesToWindow, false);
};

sizeCanvasesToWindow = function(event, magnification) {
  var canvasCopy, contextCopy, d, e, g, height, oh, ow, w, width;
  if (magnification == null) {
    magnification = 1;
  }
  w = window;
  d = document;
  e = d.documentElement;
  g = d.getElementsByTagName('body')[0];
  width = w.innerWidth || e.clientWidth || g.clientWidth;
  height = w.innerHeight || e.clientHeight || g.clientHeight;
  ow = canvas.width;
  oh = canvas.height;
  canvasCopy = document.createElement('canvas');
  contextCopy = canvasCopy.getContext('2d');
  canvasCopy.width = ow;
  canvasCopy.height = oh;
  contextCopy.drawImage(canvas, 0, 0);
  sizeCanvas(canvas, width / magnification, height / magnification);
  ctx.drawImage(canvasCopy, 0, 0, width / magnification, height / magnification);
  canvas.style.zoom = magnification;
  canvas.style.MozTransformOrigin = "0 0";
  canvas.style.MozTransform = "scale(" + magnification + ", " + magnification + ")";
  return canvas.aspect_ratio = canvas.width / canvas.height;
};

sizeCanvas = function(canvas, width, height) {
  canvas.width = width;
  return canvas.height = height;
};

imageSmoothing = function(context, a) {
  if (context == null) {
    context = ctx;
  }
  if (a == null) {
    a = false;
  }
  context.webkitImageSmoothingEnabled = a;
  context.mozImageSmoothingEnabled = a;
  return context.imageSmoothingEnabled = a;
};

window.Mouse = {
  x: 500,
  y: 500,
  up: true,
  down: false,
  clicks: 0,
  points: [
    {
      x: 500,
      y: 500
    }
  ],
  smooth: [
    {
      x: 500,
      y: 500
    }
  ],
  maxLength: 3,
  events: {
    up: function(e) {
      Mouse.up = true;
      return Mouse.down = !Mouse.up;
    },
    down: function(e) {
      e.preventDefault();
      Mouse.down = true;
      Mouse.up = !Mouse.down;
      Mouse.clicks++;
      if (!('touches' in e)) {
        brush_mode += 1;
        brush_mode = brush_mode % 3;
      }
      if ('touches' in e) {
        switch (e.touches.length) {
          case 4:
            return invert();
          case 3:
            color_mode += 1;
            return color_mode = color_mode % 3;
          case 2:
            brush_mode += 1;
            return brush_mode = brush_mode % 3;
        }
      }
    },
    move: function(e) {
      var mpl;
      if ('touches' in e) {
        e.preventDefault();
        e = e.touches[0];
      }
      if (e.pageX === Mouse.x || e.pageY === Mouse.y) {
        return;
      }
      Mouse.x = ((e.pageX / window.innerWidth) * 1000) | 0;
      Mouse.y = ((e.pageY / window.innerHeight) * 1000) | 0;
      Mouse.points.push({
        x: Mouse.x,
        y: Mouse.y
      });
      if (Mouse.points.length > 2) {
        mpl = Mouse.points.length;
        Mouse.smooth.push({
          x: (Mouse.points[mpl - 1].x + Mouse.points[mpl - 2].x) * 0.5,
          y: (Mouse.points[mpl - 1].y + Mouse.points[mpl - 2].y) * 0.5
        });
        if (Mouse.smooth.length > Mouse.maxLength) {
          Mouse.smooth.shift();
          return Mouse.smooth.shift();
        }
      }
    }
  }
};

gif_canvas = document.createElement('canvas');

gif_ctx = gif_canvas.getContext('2d');

gif_canvas.width = gif_canvas.height = 500;

overlay = {
  make: function() {
    var overlay_ctx;
    window.overlay_canvas = document.createElement('canvas');
    overlay_ctx = overlay_canvas.getContext('2d');
    overlay_canvas.style.zIndex = 2;
    overlay_canvas.style.backgroundColor = 'rgba(0,0,0,0.0)';
    overlay_canvas.style.postion = 'absolute';
    overlay_canvas.style.top = 0;
    overlay_canvas.style.left = 0;
    overlay_canvas.width = window.innerWidth;
    overlay_canvas.height = window.innerHeight;
    overlay_ctx.fillStyle = 'hsla(0,0%,50%,0.6)';
    overlay_ctx.fillRect(0, 0, overlay_canvas.width, overlay_canvas.height);
    overlay_ctx.lineWidth = 3;
    overlay_ctx.strokeStyle = 'black';
    overlay_ctx.strokeRect((window.innerWidth - 500) / 2, (window.innerHeight - 500) / 2, 500, 500);
    overlay_ctx.clearRect((window.innerWidth - 500) / 2, (window.innerHeight - 500) / 2, 500, 500);
    return document.body.appendChild(overlay_canvas);
  },
  "delete": function() {
    if (typeof overlay_canvas !== "undefined" && overlay_canvas !== null) {
      return document.body.removeChild(overlay_canvas);
    }
  }
};

gif_captureCanvas = function(area) {
  var capture_height, capture_width, sx, sy;
  if (area == null) {
    area = 'center';
  }
  this.gif_captureCanvas_id = requestAnimationFrame((function() {
    return gif_captureCanvas(area);
  }));
  if (area === 'mouse') {
    sx = between(0, Mouse.x / 1000 * canvas.width - 250, canvas.width - 500);
    sy = between(0, Mouse.y / 1000 * canvas.height - 250, canvas.width - 500);
    gif_ctx.drawImage(canvas, sx, sy, 500, 500, 0, 0, 500, 500);
  }
  if (area === 'center') {
    capture_width = Math.min(500, canvas.width);
    capture_height = Math.min(500, canvas.height);
    gif.setOptions({
      width: capture_width,
      height: capture_height
    });
    sx = (canvas.width - capture_width) / 2;
    sy = (canvas.height - capture_height) / 2;
    gif_ctx.drawImage(canvas, sx | 0, sy | 0, capture_width, capture_height, 0, 0, capture_width, capture_height);
  }
  return console.log('capturing');
};

window.gif = new GIF({
  workers: 2,
  quality: 75,
  width: 500,
  height: 500
});

for (i = _i = 0; _i < 12; i = _i += 1) {
  gif.addFrame(gif_canvas, {
    delay: 120
  });
}

gif.on('finished', function(blob) {
  window.open(URL.createObjectURL(blob));
  gif.running = false;
  cancelAnimationFrame(gif_captureCanvas_id);
  return overlay["delete"]();
});

keyPress = function(e) {
  var link;
  storeCanvas(v_ctx);
  switch (e.charCode) {
    case 32:
      return smoothing_bool = !smoothing_bool;
    case 49:
      return color_mode = 0;
    case 50:
      return color_mode = 1;
    case 51:
      return color_mode = 2;
    case 101:
      return greyscale();
    case 119:
      return invert();
    case 114:
      color_mode = 2;
      threshold(127);
      return invert();
    case 100:
      smoothing_bool = false;
      return dither();
    case 109:
      gif_captureCanvas('mouse');
      return gif.render();
    case 103:
      if (!gif.running) {
        overlay.make();
        gif_ctx;
        gif_captureCanvas('center');
        return gif.render();
      }
      break;
    case 112:
      link = document.createElement('a');
      link.download = Date.now() + ".png";
      link.href = canvas.toDataURL();
      return window.open(link);
    case 102:
      return flatten();
    case 99:
      if (!webcam_running) {
        initCam();
      }
      webcam_status++;
      return webcam_status %= webcam_modes.length;
    default:
      return console.log("charCode " + e.charCode);
  }
};

sin = function(a) {
  return Math.sin(a);
};

cos = function(a) {
  return Math.cos(a);
};

between = function(min, x, max) {
  return Math.min(Math.max(x, min), max);
};

mean = function(array) {
  var sum, _j, _ref;
  sum = 0;
  for (i = _j = 0, _ref = array.length; _j < _ref; i = _j += 1) {
    sum += array[i];
  }
  if (array.length) {
    return sum / array.length;
  } else {
    return 0;
  }
};

distance = function(x1, y1, x2, y2) {
  var dx, dy;
  dx = x2 - x1;
  dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
};

rgba = function(r, g, b, a) {
  if (r == null) {
    r = 255;
  }
  if (g == null) {
    g = 0;
  }
  if (b == null) {
    b = 255;
  }
  if (a == null) {
    a = 1;
  }
  r = between(0, r | 0, 255);
  g = between(0, g | 0, 255);
  b = between(0, b | 0, 255);
  a = between(0, a, 1);
  return "rgba( " + r + ", " + g + ", " + b + ", " + a + ")";
};

hsla = function(h, s, l, a) {
  if (h == null) {
    h = 0;
  }
  if (s == null) {
    s = 100;
  }
  if (l == null) {
    l = 50;
  }
  if (a == null) {
    a = 1;
  }
  h = (h | 0) % 360;
  s = between(0, s, 100);
  l = between(0, l, 100);
  a = between(0, a, 1);
  return "hsla(" + h + ", " + s + "%, " + l + "%, " + a + ")";
};

rainbow = function(a, alpha, offset) {
  var b, g, r;
  if (alpha == null) {
    alpha = 0.9;
  }
  if (offset == null) {
    offset = 1;
  }
  r = Math.sin(a + 0 * Math.PI / 3 * offset) * 127 + 128;
  g = Math.sin(a + 2 * Math.PI / 3 * offset) * 127 + 128;
  b = Math.sin(a + 4 * Math.PI / 3 * offset) * 127 + 128;
  return rgba(r, g, b, alpha);
};

dot = function(x, y, color, radius) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2, false);
  ctx.closePath();
  return ctx.fill();
};

drawLine = function(points, color, width) {
  var p, p0, _j, _ref;
  if (width == null) {
    width = 13;
  }
  p0 = points[0];
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(p0.x / 1000 * canvas.width, p0.y / 1000 * canvas.height);
  for (i = _j = 0, _ref = points.length; _j < _ref; i = _j += 1) {
    p = points[i];
    ctx.lineTo(p.x / 1000 * canvas.width, p.y / 1000 * canvas.height);
  }
  return ctx.stroke();
};

drawLine1 = function(points, hue_base, hue_mode, dot_x, dot_y) {
  var hue_1, hue_2;
  if (hue_base == null) {
    hue_base = 0;
  }
  switch (hue_mode) {
    case 1:
      hue_1 = rainbow(Date.now() / 300 + hue_base, 1, 1);
      hue_2 = rainbow(-Date.now() / 310 - Math.PI / 2 + hue_base, 1, 1);
      break;
    case 2:
      hue_1 = hsla(0, 0, 100 * ((hue_base + 1) % 2), 1);
      hue_2 = hsla(0, 0, 100 * (hue_base % 2), 1);
      break;
    default:
      hue_1 = hsla(hue_base + 180, 100, 50, 1);
      hue_2 = hsla(hue_base, 100, 50, 1);
  }
  drawLine(points, hue_1, 13 / last_zoom);
  dot(dot_x, dot_y, hue_2, 11 / last_zoom);
  dot(Mouse.x / 1000 * canvas.width, Mouse.y / 1000 * canvas.height, hue_1, 5 / last_zoom);
  return dot(Mouse.x / 1000 * canvas.width, Mouse.y / 1000 * canvas.height, hue_2, 3 / last_zoom);
};

drawLine2 = function(points, hue_base, hue_mode) {
  var i_one, _j, _ref, _results;
  if (hue_base == null) {
    hue_base = 0;
  }
  ctx.lineCap = 'butt';
  _results = [];
  for (i = _j = 1, _ref = points.length; _j < _ref; i = _j += 1) {
    i_one = i / points.length;
    ctx.strokeStyle = (function() {
      switch (hue_mode) {
        case 1:
          return rainbow(-Date.now() / 1000 - i_one * 4, 1 / 2 - i_one / 3);
        case 2:
          return hsla(0, 0, (Math.sin(Date.now() / 1600 + i_one * 3) + 1) * 50, 1);
        default:
          return hsla(180 * (((i + Date.now() / 300) / 5 | 0) % 2) + hue_base, 100, 50, 1);
      }
    })();
    ctx.beginPath();
    ctx.moveTo(points[i - 1].x / 1000 * canvas.width, points[i - 1].y / 1000 * canvas.height);
    ctx.lineWidth = (points.length - i) * 3 / last_zoom;
    ctx.lineTo(points[i].x / 1000 * canvas.width, points[i].y / 1000 * canvas.height);
    _results.push(ctx.stroke());
  }
  return _results;
};

drawLine3 = function(points, hue_base, hue_mode) {
  var i_one, px, py, radius, _j, _ref;
  if (hue_base == null) {
    hue_base = 0;
  }
  for (i = _j = 1, _ref = points.length - 1; _j < _ref; i = _j += 1) {
    i_one = i / points.length;
    ctx.fillStyle = (function() {
      switch (hue_mode) {
        case 1:
          return rainbow(i_one * 2 + Date.now() / 900, 1 - i_one / 4, 2);
        case 2:
          return rainbow(i_one * 2 + Date.now() / 900, 1 - i_one / 4, 0);
        default:
          return hsla(180 * (i % 2) + hue_base, 100, 50, 1);
      }
    })();
    radius = distance(points[i - 1].x / 1000 * canvas.width, points[i - 1].y / 1000 * canvas.height, points[i + 1].x / 1000 * canvas.width, points[i + 1].y / 1000 * canvas.height) / 2;
    px = points[i].x / 1000 * canvas.width;
    py = points[i].y / 1000 * canvas.height;
    ctx.beginPath();
    ctx.arc(px, py, radius * i_one / last_zoom + 3, 0, Math.PI * 2, false);
    ctx.closePath();
    ctx.fill();
    if (hue_mode === 0) {
      ctx.fillStyle = hsla(180 * (i % 2) + 180 + hue_base, 100, 50, 1);
      ctx.beginPath();
      ctx.arc(px, py, radius / 2 * i_one / last_zoom, 0, Math.PI * 2, false);
      ctx.closePath();
      ctx.fill();
    }
  }
  if (hue_mode === 0) {
    ctx.fillStyle = hsla(hue_base, 100, 50, 1);
    ctx.beginPath();
    ctx.arc(Mouse.x / 1000 * canvas.width, Mouse.y / 1000 * canvas.height, 4 / last_zoom, 0, Math.PI * 2, false);
    ctx.closePath();
    return ctx.fill();
  }
};

uDLine1 = function(points, hue_base, hue_mode) {
  var hue_1, hue_2, _j, _ref;
  if (hue_base == null) {
    hue_base = 0;
  }
  switch (hue_mode) {
    case 1:
      hue_1 = rainbow(Date.now() / 300, 1, 1);
      hue_2 = rainbow(-Date.now() / 310 - Math.PI / 2, 1, 1);
      break;
    case 2:
      hue_1 = hsla(0, 0, 0, 1);
      hue_2 = hsla(0, 0, 100, 1);
      break;
    default:
      hue_1 = hsla(hue_base, 100, 50, 1);
      hue_2 = hsla(hue_base + 180, 100, 50, 1);
  }
  ctx.strokeStyle = hue_2;
  ctx.lineWidth = 9 / last_zoom;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (i = _j = 1, _ref = points.length; _j < _ref; i = _j += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
  dot(points[0].x, points[0].y, hue_1, 9 / last_zoom);
  return dot(points[0].x, points[0].y, hue_2, 4 / last_zoom);
};

uDLine2 = function(points, hue_base, hue_mode) {
  var dist;
  if (hue_base == null) {
    hue_base = 0;
  }
  dist = distance(points[0].x, points[0].y, points[1].x + 1, points[1].y + 1);
  ctx.strokeStyle = (function() {
    switch (hue_mode) {
      case 1:
        return rainbow(-Date.now() / 1000);
      case 2:
        return hsla(0, 0, (Math.sin(Date.now() / 100 + 3) + 1) * 50, 1);
      default:
        return hsla(180 * (((Date.now() / 200) / 5 | 0) % 2) + hue_base, 100, 50, 1);
    }
  })();
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  ctx.lineTo(points[1].x, points[1].y);
  ctx.lineWidth = Math.min(canvas.width, canvas.height) / (dist / 2 + 1) + 5;
  return ctx.stroke();
};

uDLine3 = function(points, hue_base, hue_mode) {
  var i_one, px, py, radius, _j, _ref, _results;
  if (hue_base == null) {
    hue_base = 0;
  }
  if (hue_mode === 2) {
    ctx.strokeStyle = hsla(0, 0, Math.sin(Date.now() / 900 + hue_base) * -49 + 50, 1);
    ctx.lineWidth = 3;
  }
  _results = [];
  for (i = _j = 0, _ref = points.length; _j < _ref; i = _j += 1) {
    i_one = i / points.length;
    ctx.fillStyle = (function() {
      switch (hue_mode) {
        case 1:
          return rainbow(i_one * 2 + Date.now() / 900 + hue_base, 1 - i_one / 4, 2);
        case 2:
          return hsla(0, 0, Math.sin(-Date.now() / 900 + hue_base) * 49 + 50, 0.25);
        default:
          return hsla(180 * (i % 2) + hue_base, 100, 50, 1);
      }
    })();
    radius = distance(points[0].x, points[0].y, points[i].x, points[i].y) / 2;
    radius = Math.min(radius, Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height) / 8);
    px = points[i].x;
    py = points[i].y;
    ctx.beginPath();
    ctx.arc(px, py, radius * i_one / last_zoom + 3, 0, Math.PI * 2, false);
    ctx.closePath();
    if (hue_mode === 2) {
      ctx.stroke();
    }
    ctx.fill();
    if (hue_mode === 0) {
      ctx.fillStyle = hsla(180 * (i % 2) + 180 + hue_base, 100, 50, 1);
      ctx.beginPath();
      ctx.arc(px, py, radius / 2 * i_one / last_zoom, 0, Math.PI * 2, false);
      ctx.closePath();
      _results.push(ctx.fill());
    } else {
      _results.push(void 0);
    }
  }
  return _results;
};

decay = function(h, v, s, r) {
  var dh, dw, dx, dy;
  ctx.save();
  ctx.translate(canvas.width / 2 + h, canvas.height / 2 + v);
  if (r !== 0) {
    ctx.rotate(r);
  }
  dx = -(canvas.width + s) / 2;
  dy = -(canvas.height + s) / 2;
  dw = canvas.width + s;
  dh = canvas.height + s;
  ctx.drawImage(canvas, dx, dy, dw, dh);
  return ctx.restore();
};

edgePaint = function() {
  if (color_mode === 2) {
    ctx.fillStyle = rainbow(Date.now() / 6000, 1, 0);
  } else {
    ctx.fillStyle = rainbow(Date.now() / 8100);
  }
  ctx.fillRect(0, 0, canvas.width, 1);
  ctx.fillRect(canvas.width - 1, 0, 1, canvas.height);
  ctx.fillRect(0, canvas.height - 1, canvas.width, 1);
  return ctx.fillRect(0, 1, 1, canvas.height);
};

invert = function() {
  var d, index, n;
  d = ctx.getImageData(0, 0, canvas.width, canvas.height);
  n = 0;
  while (n < d.width * d.height) {
    index = n * 4;
    d.data[index + 0] = 255 - d.data[index + 0];
    d.data[index + 1] = 255 - d.data[index + 1];
    d.data[index + 2] = 255 - d.data[index + 2];
    n++;
  }
  return ctx.putImageData(d, 0, 0);
};

greyscale = function() {
  var b, d, g, n, r, v;
  d = ctx.getImageData(0, 0, canvas.width, canvas.height);
  n = 0;
  while (n < d.width * d.height) {
    i = n * 4;
    r = d.data[i];
    g = d.data[i + 1];
    b = d.data[i + 2];
    v = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
    n++;
  }
  return ctx.putImageData(d, 0, 0);
};

threshold = function(t) {
  var b, d, g, n, r, v;
  d = ctx.getImageData(0, 0, canvas.width, canvas.height);
  n = 0;
  while (n < d.width * d.height) {
    i = n * 4;
    r = d.data[i];
    g = d.data[i + 1];
    b = d.data[i + 2];
    v = (0.2126 * r + 0.7152 * g + 0.0722 * b >= t ? 255 : 0);
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
    n++;
  }
  return ctx.putImageData(d, 0, 0);
};

flatten = function() {
  var d, n, r, _ref;
  d = ctx.getImageData(0, 0, canvas.width, canvas.height);
  n = 0;
  r = 203;
  while (n < d.width * d.height) {
    i = n * 4;
    d.data[i + 0] = (d.data[i + 0] / r | 0) * r;
    d.data[i + 1] = (d.data[i + 1] / r | 0) * r;
    d.data[i + 2] = (d.data[i + 2] / r | 0) * r;
    if (d.data[i] + d.data[i + 1] + d.data[i + 2] <= 30 || ((d.data[i] === (_ref = d.data[i + 1]) && _ref === d.data[i + 2]))) {
      d.data[i + 3] = 0;
    }
    n++;
  }
  return ctx.putImageData(d, 0, 0);
};

dither = function(t) {
  var b, d, g, n, r, v;
  invert();
  d = ctx.getImageData(0, 0, canvas.width, canvas.height);
  n = 0;
  while (n < d.width * d.height) {
    i = n * 4;
    r = d.data[i];
    g = d.data[i + 1];
    b = d.data[i + 2];
    v = (0.2126 * r + 0.7152 * g + 0.0722 * b >= t ? 255 : 0);
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
    d.data[n + 4] = 0;
    n += 8;
  }
  return ctx.putImageData(d, 0, 0);
};

window.video = document.getElementById('camvid');

v_canvas = document.createElement('canvas');

v_ctx = v_canvas.getContext('2d');

window.URL = window.URL || window.webkitURL;

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

webcam_running = null;

webcam_status = 0;

webcam_modes = ['off', 'center', 'full'];

initCam = function() {
  var options, videoHandler;
  if (webcam_running == null) {
    if (navigator.getUserMedia != null) {
      options = {
        video: true,
        audio: false
      };
      navigator.getUserMedia(options, (function(stream) {
        return video.src = window.URL.createObjectURL(stream);
      }), (function() {
        return console.log('failure');
      }));
    }
    videoHandler = function() {
      if (video.videoHeight === 0 || video.videoWidth === 0) {

      } else {
        v_canvas.width = video.videoWidth / 2;
        v_canvas.height = video.videoHeight / 2;
        v_ctx.translate(v_canvas.width, 0);
        v_ctx.scale(-1, 1);
        webcam_running = true;
        video.removeEventListener('timeupdate', videoHandler, false);
        console.log('handled');
        v_ctx.drawImage(video, 0, 0, v_canvas.width, v_canvas.height);
        storeCanvas(v_ctx);
        return v_canvas.aspect_ratio = v_canvas.width / v_canvas.height;
      }
    };
    return video.addEventListener('timeupdate', videoHandler, false);
  } else {
    return webcam_running = true;
  }
};

killCam = function() {
  return webcam_running = false;
};

compare = null;

storeCanvas = function(context) {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  context.drawImage(video, 0, 0, context.canvas.width, context.canvas.height);
  return compare = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
};

match = function(context, compare) {
  var b_match, d, g_match, n, r_match, spread, _ref, _ref1, _ref2;
  d = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
  n = 0;
  spread = 16;
  while (n < d.width * d.height) {
    i = n * 4;
    r_match = ((compare.data[i + 0] - spread) < (_ref = d.data[i + 0]) && _ref < (compare.data[i + 0] + spread));
    g_match = ((compare.data[i + 1] - spread) < (_ref1 = d.data[i + 1]) && _ref1 < (compare.data[i + 1] + spread));
    b_match = ((compare.data[i + 2] - spread) < (_ref2 = d.data[i + 2]) && _ref2 < (compare.data[i + 2] + spread));
    if (b_match || r_match || g_match) {
      d.data[i + 3] = 0;
    }
    n++;
  }
  return context.putImageData(d, 0, 0);
};

cycle = function(context) {
  var d, n;
  d = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
  n = 0;
  while (n < d.width * d.height) {
    i = n * 4;
    if (d.data[i + 3] !== 0) {
      d.data[i + 0] = (d.data[i + 0] + Date.now() / 19) % 255;
      d.data[i + 1] = (d.data[i + 1] + Date.now() / 20) % 255;
      d.data[i + 2] = (d.data[i + 2] + Date.now() / 21) % 255;
    }
    n++;
  }
  return context.putImageData(d, 0, 0);
};

camsPainted = 0;

paintCam = function() {
  var dh, dw, dx, dy;
  if (webcam_modes[webcam_status] !== 'off') {
    v_ctx.drawImage(video, 0, 0, v_canvas.width, v_canvas.height);
    if (camsPainted % 18 === 0) {
      storeCanvas(v_ctx);
    }
    if (compare != null) {
      match(v_ctx, compare);
    }
    cycle(v_ctx);
    if (webcam_modes[webcam_status] === 'center') {
      dx = (canvas.width - v_canvas.width / last_zoom * 2) / 2;
      dy = (canvas.height - v_canvas.height / last_zoom * 2) / 2;
      dw = v_canvas.width / last_zoom * 2;
      dh = v_canvas.height / last_zoom * 2;
    } else if (webcam_modes[webcam_status] === 'full') {
      if (v_canvas.aspect_ratio <= canvas.aspect_ratio) {
        dw = canvas.width;
        dh = canvas.width / v_canvas.aspect_ratio;
        dx = 0;
        dy = (canvas.height - dh) / 2;
      }
      if (v_canvas.aspect_ratio >= canvas.aspect_ratio) {
        dw = canvas.height * v_canvas.aspect_ratio;
        dh = canvas.height;
        dx = (canvas.width - dw) / 2;
        dy = 0;
      }
    }
    ctx.drawImage(v_canvas, dx, dy, dw, dh);
    return camsPainted++;
  }
};

initCanvas();

(animloop = function() {
  var decay_rotate, decay_spread, decay_x, decay_y, hue_slicer, local_x, local_y, thisFrameFPS, uD_b, uD_c, uD_x, uD_y, udxArray, udyArray, _j, _ref, _results;
  this.animloop_id = requestAnimationFrame(animloop);
  thisFrameFPS = 1000 / ((fps_now = Date.now()) - lastUpdate);
  fps += (thisFrameFPS - fps) / fpsFilter;
  lastUpdate = fps_now;
  if (ctx.imageSmoothingEnabled !== smoothing_bool) {
    imageSmoothing(ctx, smoothing_bool);
  }
  me[1] = Mouse.x;
  me[2] = Mouse.y;
  me[3] = color_mode;
  me[4] = brush_mode;
  if (!connected) {
    x_mean = Mouse.x;
  }
  if (!connected) {
    y_mean = Mouse.y;
  }
  paintCam();
  decay_x = (x_mean / canvas.width - 0.5) * -4;
  decay_y = (y_mean / canvas.height - 0.5) * -4;
  decay_spread = 4;
  decay_rotate = decay_x / 4 - decay_y / 4;
  decay(decay_x / last_zoom, decay_y / last_zoom, decay_spread, decay_rotate / 90);
  decay(decay_x / 10 / last_zoom, decay_y / 10 / last_zoom, decay_spread * -2 / 3, -decay_rotate / 91);
  udxArray = [];
  udyArray = [];
  hue_slicer = 300 / (userData.length + 1);
  edgePaint();
  if (!connected) {
    switch (brush_mode) {
      case 1:
        if (Mouse.maxLength !== 18) {
          Mouse.maxLength = 18;
        }
        drawLine2(Mouse.smooth, hue_slicer, color_mode);
        break;
      case 2:
        if (Mouse.maxLength !== 30) {
          Mouse.maxLength = 30;
        }
        drawLine3(Mouse.smooth, hue_slicer, color_mode);
        break;
      default:
        if (Mouse.maxLength !== 3) {
          Mouse.maxLength = 3;
        }
        local_x = Mouse.x / 1000 * canvas.width;
        local_y = Mouse.y / 1000 * canvas.height;
        if (Date.now() % 600 < 60) {
          local_x = Mouse.smooth[Mouse.smooth.length - 1].x / 1000 * canvas.width;
          local_y = Mouse.smooth[Mouse.smooth.length - 1].y / 1000 * canvas.height;
        }
        drawLine1(Mouse.smooth, hue_slicer, color_mode, local_x, local_y);
    }
    return;
  }
  _results = [];
  for (i = _j = 0, _ref = userData.length; _j < _ref; i = _j += 1) {
    uD_x = userData[i][1] / 1000 * canvas.width;
    uD_y = userData[i][2] / 1000 * canvas.height;
    uD_c = userData[i][3];
    uD_b = userData[i][4];
    if (isNaN(uD_x)) {
      uD_x = canvas.width / 2;
    }
    if (isNaN(uD_y)) {
      uD_y = canvas.height / 2;
    }
    uDPoints[i] = [];
    if (userData[i][0] === me[0]) {
      switch (brush_mode) {
        case 1:
          if (Mouse.maxLength !== 18) {
            Mouse.maxLength = 18;
          }
          drawLine2(Mouse.smooth, hue_slicer * i, color_mode);
          break;
        case 2:
          if (Mouse.maxLength !== 30) {
            Mouse.maxLength = 30;
          }
          drawLine3(Mouse.smooth, hue_slicer * i, color_mode);
          break;
        default:
          if (Mouse.maxLength !== 3) {
            Mouse.maxLength = 3;
          }
          drawLine1(Mouse.smooth, hue_slicer * i, color_mode, uD_x, uD_y);
      }
    } else {
      uDPoints[i].unshift({
        x: x_old[i],
        y: y_old[i]
      });
      uDPoints[i].unshift({
        x: uD_x,
        y: uD_y
      });
      x_old[i] = uD_x;
      y_old[i] = uD_y;
      udxArray.push(x_old[i]);
      udyArray.push(y_old[i]);
      switch (uD_b) {
        case 1:
          uDLine2(uDPoints[i], i * hue_slicer, uD_c);
          break;
        case 2:
          uDLine3(uDPoints[i], i * hue_slicer, uD_c);
          break;
        default:
          uDLine1(uDPoints[i], i * hue_slicer, uD_c);
      }
    }
    udxArray.push(Mouse.x / 1000 * canvas.width);
    udyArray.push(Mouse.y / 1000 * canvas.height);
    x_mean = mean(udxArray);
    _results.push(y_mean = mean(udyArray));
  }
  return _results;
})();

window.addEventListener('resize', (function() {
  return scaled_count = 0;
}), false);

window.addEventListener('onorientationchange', (function() {
  return scaled_count = 0;
}), false);

window.addEventListener('mousedown', Mouse.events.down, false);

window.addEventListener('mouseup', Mouse.events.up, false);

window.addEventListener('mousemove', Mouse.events.move, false);

window.addEventListener('touchstart', Mouse.events.down, false);

window.addEventListener('touchend', Mouse.events.up, false);

window.addEventListener('touchmove', Mouse.events.move, false);

window.addEventListener('keypress', keyPress, false);

}
/*
     FILE ARCHIVED ON 12:24:58 Nov 16, 2020 AND RETRIEVED FROM THE
     INTERNET ARCHIVE ON 16:12:57 Feb 03, 2021.
     JAVASCRIPT APPENDED BY WAYBACK MACHINE, COPYRIGHT INTERNET ARCHIVE.

     ALL OTHER CONTENT MAY ALSO BE PROTECTED BY COPYRIGHT (17 U.S.C.
     SECTION 108(a)(3)).
*/
/*
playback timings (ms):
  RedisCDXSource: 0.702
  PetaboxLoader3.datanode: 169.171 (4)
  PetaboxLoader3.resolve: 113.17 (2)
  LoadShardBlock: 144.242 (3)
  captures_list: 172.743
  esindex: 0.013
  exclusion.robots.policy: 0.162
  CDXLines.iter: 23.579 (3)
  load_resource: 219.71
  exclusion.robots: 0.176
*/
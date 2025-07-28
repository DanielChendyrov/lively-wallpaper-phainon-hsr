var size = 86;
var columns = Array.from(document.getElementsByClassName('column'));
var d = void 0,
  c = void 0;
var classList = ['visible', 'close', 'far', 'far', 'distant', 'distant'];
var use24HourClock = true;

// Create and setup video background
function initVideoBackground() {
  const video = document.getElementById('bg-video');
  
  if (!video) {
    console.warn('Video element not found');
    return;
  }
  
  // Add error handling
  video.onerror = function(e) {
    console.warn('Video failed to load:', e);
    document.body.style.backgroundColor = '#131415';
  };
  
  video.onloadeddata = function() {
    console.log('Video loaded successfully');
  };
  
  video.oncanplay = function() {
    console.log('Video can start playing');
    // Force play for Lively Wallpaper
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(function(error) {
        console.warn('Video autoplay failed:', error);
        // Try again after a short delay
        setTimeout(() => {
          video.play().catch(console.warn);
        }, 500);
      });
    }
  };
  
  // Additional check for Lively Wallpaper environment
  if (typeof livelyCurrentTrack !== 'undefined' || window.lively) {
    console.log('Running in Lively Wallpaper environment');
  }
  
  // Force video to load and play
  video.load();
}

// Initialize video when page loads
window.addEventListener('DOMContentLoaded', initVideoBackground);

function padClock(p, n) {
  return p + ('0' + n).slice(-2);
}

function getClock() {
  d = new Date();
  return [use24HourClock ? d.getHours() : d.getHours() % 12 || 12, d.getMinutes(), d.getSeconds()].reduce(padClock, '');
}

function getClass(n, i2) {
  return (
    classList.find(function (class_, classIndex) {
      return Math.abs(n - i2) === classIndex;
    }) || ''
  );
}

var loop = setInterval(function () {
  c = getClock();

  columns.forEach(function (ele, i) {
    var n = +c[i];
    var offset = -n * size;
    // Restored original positioning logic
    ele.style.transform = 'translateY(calc(50vh + ' + offset + 'px - ' + size / 2 + 'px))';
    Array.from(ele.children).forEach(function (ele2, i2) {
      ele2.className = 'num ' + getClass(n, i2);
    });
  });
}, 200 + Math.E * 10);

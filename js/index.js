/* ---------------------------------------------------------------------------
   The Deliverer's Tragedy — Honkai: Star Rail live wallpaper

   The clock is a counter: eight numerals standing in the seam of the scene,
   separated by the trailer's rhombus, counting the seconds of a doomed man.
--------------------------------------------------------------------------- */

(function () {
  'use strict';

  var USE_24_HOUR_CLOCK = true;

  /* Must match the strip's transition duration in css/style.css. */
  var ROLL_MS = 380;

  var stack = document.getElementById('stack');
  var dateEl = document.getElementById('date');
  var counterEl = document.getElementById('counter');

  /* ------------------------------------------------------------------ video */

  (function startVideo() {
    var video = document.querySelector('.backdrop');
    var attempts = 0;

    function attempt() {
      var promise = video.play();
      if (!promise) {
        return;
      }
      promise.catch(function () {
        // Lively occasionally needs a nudge before the clip will roll.
        if (attempts < 5) {
          attempts += 1;
          window.setTimeout(attempt, 800);
        }
      });
    }

    video.addEventListener('canplay', attempt, { once: true });
    if (video.readyState >= 3) {
      attempt();
    }
  })();

  /* ------------------------------------------------------------------- reel */

  /**
   * A single digit that rolls vertically when its value changes.
   *
   * The strip holds the digits in order and --offset counts how many em it
   * has travelled, so the digit at the reading line is always the one on show.
   * Rolling forward pushes the offset down by one em; once the roll is done
   * the spent digit is trimmed off the top and the offset is pushed back,
   * which leaves the picture exactly where it was.
   */
  function Reel() {
    this.strip = document.createElement('ol');
    this.strip.className = 'reel__strip';
    this.offset = 0;
    this.value = null;
    this.rolling = false;
    this.onTransitionEnd = null;
  }

  Reel.prototype.cancelRoll = function () {
    this.rolling = false;
    if (this.onTransitionEnd) {
      this.strip.removeEventListener('transitionend', this.onTransitionEnd);
      this.onTransitionEnd = null;
    }
  };

  Reel.prototype.reset = function (digit) {
    this.cancelRoll();

    var li = document.createElement('li');
    li.textContent = digit;

    this.strip.textContent = '';
    this.strip.appendChild(li);

    this.value = Number(digit);
    this.offset = 0;
    this.strip.classList.add('is-instant');
    this.strip.style.setProperty('--offset', '0');

    // Let the browser settle on the new position before transitions resume.
    void this.strip.offsetWidth;
    this.strip.classList.remove('is-instant');
  };

  Reel.prototype.set = function (digit) {
    var value = Number(digit);

    if (value === this.value) {
      return;
    }

    // Only roll when the digit follows its predecessor. Anything else — a
    // skipped minute, the hour rolling over — snaps into place instead.
    if (this.value === null || (this.value + 1) % 10 !== value) {
      this.reset(digit);
      return;
    }

    var li = document.createElement('li');
    li.textContent = digit;
    this.strip.appendChild(li);

    this.value = value;
    this.offset -= 1;
    this.strip.style.setProperty('--offset', String(this.offset));

    this.rolling = true;

    var self = this;
    function finish(event) {
      if (event && event.propertyName !== 'transform') {
        return;
      }
      if (!self.rolling) {
        return;
      }
      self.cancelRoll();
      self.trim();
    }

    this.onTransitionEnd = finish;
    this.strip.addEventListener('transitionend', finish);

    // The transition may be suppressed (no motion, or a hidden tab), so the
    // trim still happens if the event never arrives.
    window.setTimeout(function () {
      finish(null);
    }, ROLL_MS + 200);
  };

  Reel.prototype.trim = function () {
    if (this.strip.firstElementChild) {
      this.strip.removeChild(this.strip.firstElementChild);
    }
    this.offset += 1;
    this.strip.classList.add('is-instant');
    this.strip.style.setProperty('--offset', String(this.offset));
    void this.strip.offsetWidth;
    this.strip.classList.remove('is-instant');
  };

  /* ------------------------------------------------------------------ stack */

  /* Two digits, a separator, two digits. */
  var LAYOUT = ['h', 'h', null, 'm', 'm'];
  var reels = [];

  LAYOUT.forEach(function (part) {
    if (part === null) {
      var separator = document.createElement('span');
      separator.className = 'lozenge';
      stack.appendChild(separator);
      return;
    }

    var reel = new Reel();
    var element = document.createElement('div');
    element.className = 'reel';
    element.appendChild(reel.strip);
    stack.appendChild(element);

    reels.push(reel);
  });

  /* ------------------------------------------------------------------- date */

  var weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
  var month = new Intl.DateTimeFormat('en-US', { month: 'short' });
  var day = new Intl.DateTimeFormat('en-US', { day: '2-digit' });

  function dateParts(now) {
    return {
      weekday: weekday.format(now).toUpperCase(),
      day: day.format(now),
      month: month.format(now).toUpperCase()
    };
  }

  /* ------------------------------------------------------------------- tick */

  var lastDate = '';

  function update() {
    var now = new Date();

    var hours = now.getHours();
    if (!USE_24_HOUR_CLOCK) {
      hours = hours % 12 || 12;
    }

    var digits = [
      String(hours).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0')
    ].join('');

    reels.forEach(function (reel, index) {
      reel.set(digits[index]);
    });

    var parts = dateParts(now);
    var today = parts.weekday + ' ' + parts.day + ' ' + parts.month;

    if (today !== lastDate) {
      lastDate = today;
      dateEl.innerHTML =
        parts.weekday +
        '<span class="dot" aria-hidden="true"></span>' +
        parts.day + ' ' + parts.month;
    }

    counterEl.setAttribute(
      'aria-label',
      today + ' ' + digits.slice(0, 2) + ':' + digits.slice(2)
    );
  }

  function tick() {
    update();
    // Line the next tick up with the minute boundary so it never drifts.
    var now = new Date();
    var delay = 60000 - (now.getSeconds() * 1000 + now.getMilliseconds());
    window.setTimeout(tick, delay);
  }

  tick();
})();

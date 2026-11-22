(function () {
  var root = document.documentElement;
  var yearEl = document.getElementById('footer-year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  /* 1. Light / Dark theme management (persisted across all pages) */
  var themeButtons = Array.prototype.slice.call(document.querySelectorAll('[data-theme-set]'));
  var currentTheme = root.classList.contains('dark') ? 'dark' : 'light';
  var canvasMode = 'waves';
  var redrawCanvasTheme = function () {};

  function applyTheme(next) {
    currentTheme = next === 'dark' ? 'dark' : 'light';
    root.classList.toggle('dark', currentTheme === 'dark');
    try {
      localStorage.setItem('mahin-theme', currentTheme);
    } catch (e) {}

    themeButtons.forEach(function (btn) {
      var active = btn.getAttribute('data-theme-set') === currentTheme;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    redrawCanvasTheme();
  }

  themeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyTheme(btn.getAttribute('data-theme-set'));
    });
  });
  applyTheme(currentTheme);

  /* 2. Portrait fallback */
  var portraitImg = document.getElementById('portrait-img');
  var portraitFallback = document.getElementById('portrait-fallback');
  if (portraitImg && portraitFallback) {
    portraitImg.addEventListener('error', function () {
      portraitImg.hidden = true;
      portraitFallback.hidden = false;
    });
  }

  /* 3. Mobile navigation drawer & Back-to-top */
  var mobileToggle = document.getElementById('mobile-menu-toggle');
  var mobileMenu = document.getElementById('mobile-nav-menu');
  var iconMenu = document.getElementById('icon-menu');
  var iconClose = document.getElementById('icon-close');

  function setMobileMenu(open) {
    if (!mobileToggle || !mobileMenu) return;
    mobileMenu.hidden = !open;
    mobileToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    mobileToggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    if (iconMenu) iconMenu.hidden = open;
    if (iconClose) iconClose.hidden = !open;
  }

  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', function () {
      setMobileMenu(mobileMenu.hidden);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !mobileMenu.hidden) {
        setMobileMenu(false);
        mobileToggle.focus();
      }
    });
  }

  var backToTopBtn = document.getElementById('back-to-top');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* 4. Scroll-reveal observer */
  var revealItems = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var reduceMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(function (el) {
      el.classList.add('is-visible');
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05 }
    );
    revealItems.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* 5. Hero animated canvas (Waves & Mesh — Home page) */
  (function initHeroCanvas() {
    var canvas = document.getElementById('hero-canvas');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var parent = canvas.parentElement;
    var width = 0;
    var height = 0;
    var phase = 0;
    var rafId = 0;
    var isVisible = true;
    var points = [];
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    function getPalette() {
      return currentTheme === 'dark'
        ? ['#818CF8', '#F472B6', '#2DD4BF', '#FBBF24']
        : ['#5046E5', '#D92D84', '#0A9D90', '#E69500'];
    }

    function initPoints() {
      var count = Math.max(18, Math.min(44, Math.round((width * height) / 22000)));
      points = [];
      for (var i = 0; i < count; i++) {
        points.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          colorIdx: i % 3,
          r: 1.8 + Math.random() * 1.8,
        });
      }
    }

    function resize() {
      if (!parent) return;
      width = parent.clientWidth;
      height = parent.clientHeight;
      if (!width || !height) return;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initPoints();
    }

    function drawWaves(animate) {
      var cols = getPalette();
      if (animate) phase += 0.015;
      for (var i = 0; i < 4; i++) {
        ctx.globalAlpha = currentTheme === 'dark' ? 0.12 + i * 0.035 : 0.09 + i * 0.03;
        ctx.fillStyle = cols[i % cols.length];
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (var x = 0; x <= width + 12; x += 12) {
          var y =
            height * (0.54 + 0.1 * i) +
            Math.sin(x * 0.0055 * (1 + i * 0.25) + phase * (1 + i * 0.35) + i * 1.8) *
              (20 + i * 7);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function drawMesh(animate) {
      var cols = getPalette();
      for (var i = 0; i < points.length; i++) {
        var p = points[i];
        if (animate) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
        }
        for (var j = i + 1; j < points.length; j++) {
          var q = points[j];
          var dist = Math.hypot(p.x - q.x, p.y - q.y);
          if (dist < 155) {
            ctx.globalAlpha = (1 - dist / 155) * (currentTheme === 'dark' ? 0.38 : 0.32);
            ctx.strokeStyle = cols[p.colorIdx];
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }
      for (var k = 0; k < points.length; k++) {
        var n = points[k];
        ctx.globalAlpha = 0.78;
        ctx.fillStyle = cols[n.colorIdx];
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function render(animate) {
      ctx.clearRect(0, 0, width, height);
      if (canvasMode === 'waves') {
        drawWaves(animate);
      } else {
        drawMesh(animate);
      }
    }

    function loop() {
      rafId = 0;
      if (!isVisible || reduceMotion) return;
      render(true);
      rafId = window.requestAnimationFrame(loop);
    }

    redrawCanvasTheme = function () {
      render(false);
    };

    document.querySelectorAll('[data-canvas-mode]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        canvasMode = btn.getAttribute('data-canvas-mode');
        document.querySelectorAll('[data-canvas-mode]').forEach(function (b) {
          var active = b === btn;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        render(false);
      });
    });

    resize();
    render(false);
    if (!reduceMotion) {
      rafId = window.requestAnimationFrame(loop);
    }

    if ('IntersectionObserver' in window && parent) {
      new IntersectionObserver(function (entries) {
        isVisible = entries[0] ? entries[0].isIntersecting : true;
        if (isVisible && !rafId && !reduceMotion) {
          rafId = window.requestAnimationFrame(loop);
        }
      }).observe(parent);
    }

    var resizeTimer;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        resize();
        render(false);
      }, 150);
    });
  })();

  /* 6. Training filter tabs (About page) */
  var filterBtns = Array.prototype.slice.call(document.querySelectorAll('[data-training-filter]'));
  var trainingCards = Array.prototype.slice.call(document.querySelectorAll('.training-card'));

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var filter = btn.getAttribute('data-training-filter');
      filterBtns.forEach(function (b) {
        var selected = b === btn;
        b.classList.toggle('is-active', selected);
        b.setAttribute('aria-selected', selected ? 'true' : 'false');
      });
      trainingCards.forEach(function (card) {
        var cat = card.getAttribute('data-category');
        card.hidden = filter !== 'all' && cat !== filter;
      });
    });
  });

  /* 7. Interactive Enterprise LAN Topology inspector (Projects page) */
  var TOPOLOGY_DATA = {
    router: {
      sublabel: 'Selected Node · Router-on-a-Stick',
      label: 'Core Router (R1)',
      notes: 'Routes traffic across HR, IT, and Sales subnets using 802.1Q sub-interfaces while enforcing ACL isolation policies.',
      role: 'Inter-VLAN Routing & NAT Gateway',
      subnet: '192.168.10.0/24 (Summarized LAN)',
      gateway: 'Gi0/0.10 · .20 · .30 Sub-interfaces',
      vlan: '802.1Q Trunk Encapsulation',
      interfaces: 'Gi0/0 → SW1 Trunk · Gi0/1 → WAN Uplink',
    },
    switch: {
      sublabel: 'Selected Node · Layer 2 Managed Switch',
      label: 'Distribution Switch (SW1)',
      notes: 'Separates broadcast domains at Layer 2 with port security enabled on access ports and an 802.1Q trunk uplink to R1.',
      role: 'VLAN Segmentation & Trunking',
      subnet: 'Management VLAN 99',
      gateway: '192.168.99.1',
      vlan: 'VLANs 10, 20, 30 Active',
      interfaces: 'Fa0/1 Trunk → R1 · Fa0/2–24 Access Ports',
    },
    hr: {
      sublabel: 'Selected Node · VLAN 10',
      label: 'HR Department',
      notes: 'Dedicated /26 subnet keeping personnel workstations isolated from engineering traffic while reaching shared services via R1.',
      role: 'Administrative & Records Subnet',
      subnet: '192.168.10.0/26',
      gateway: '192.168.10.1',
      vlan: 'VLAN 10 (Access)',
      interfaces: 'SW1 Fa0/2 – Fa0/8 (62 usable hosts)',
    },
    it: {
      sublabel: 'Selected Node · VLAN 20',
      label: 'IT Department',
      notes: 'Assigned SSH administrative access to R1 and SW1 management interfaces via explicit ACL rules.',
      role: 'Infrastructure & Operations Subnet',
      subnet: '192.168.10.64/26',
      gateway: '192.168.10.65',
      vlan: 'VLAN 20 (Access)',
      interfaces: 'SW1 Fa0/9 – Fa0/16 (62 usable hosts)',
    },
    sales: {
      sublabel: 'Selected Node · VLAN 30',
      label: 'Sales Department',
      notes: 'DHCP-enabled access subnet with NAT/PAT outbound translation for external client communications.',
      role: 'Client & Operations Subnet',
      subnet: '192.168.10.128/26',
      gateway: '192.168.10.129',
      vlan: 'VLAN 30 (Access)',
      interfaces: 'SW1 Fa0/17 – Fa0/24 (62 usable hosts)',
    },
  };

  var NODE_COLORS = {
    router: { activeFill: '#D92D84', idleFill: '#3B1D5E', activeStroke: '#FBCFE8', idleStroke: '#D92D84' },
    switch: { activeFill: '#1D8FEE', idleFill: '#133A63', activeStroke: '#BAE6FD', idleStroke: '#1D8FEE' },
    hr: { activeFill: '#0A9D90', idleFill: '#0E3F3D', activeStroke: '#99F6E4', idleStroke: '#0A9D90' },
    it: { activeFill: '#D97706', idleFill: '#4A2B09', activeStroke: '#FDE68A', idleStroke: '#E69500' },
    sales: { activeFill: '#7C4DDB', idleFill: '#2E1E59', activeStroke: '#DDD6FE', idleStroke: '#7C4DDB' },
  };

  function selectTopologyNode(id) {
    var data = TOPOLOGY_DATA[id];
    var sublabelEl = document.getElementById('node-sublabel');
    if (!data || !sublabelEl) return;

    sublabelEl.textContent = data.sublabel;
    document.getElementById('node-label').textContent = data.label;
    document.getElementById('node-notes').textContent = data.notes;
    document.getElementById('node-role').textContent = data.role;
    document.getElementById('node-subnet').textContent = data.subnet;
    document.getElementById('node-gateway').textContent = data.gateway;
    document.getElementById('node-vlan').textContent = data.vlan;
    document.getElementById('node-interfaces').textContent = data.interfaces;

    document.querySelectorAll('.node-btn').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-node') === id);
    });

    Object.keys(NODE_COLORS).forEach(function (key) {
      var rect = document.getElementById('rect-' + key);
      if (!rect) return;
      var c = NODE_COLORS[key];
      var active = key === id;
      rect.setAttribute('fill', active ? c.activeFill : c.idleFill);
      rect.setAttribute('stroke', active ? c.activeStroke : c.idleStroke);
    });

    var linkR = document.getElementById('link-r-sw');
    var linkHr = document.getElementById('link-sw-hr');
    var linkIt = document.getElementById('link-sw-it');
    var linkSales = document.getElementById('link-sw-sales');
    if (linkR) linkR.setAttribute('stroke', id === 'router' || id === 'switch' ? '#F472B6' : '#64748B');
    if (linkHr) linkHr.setAttribute('stroke', id === 'router' || id === 'switch' || id === 'hr' ? '#2DD4BF' : '#64748B');
    if (linkIt) linkIt.setAttribute('stroke', id === 'router' || id === 'switch' || id === 'it' ? '#FBBF24' : '#64748B');
    if (linkSales) linkSales.setAttribute('stroke', id === 'router' || id === 'switch' || id === 'sales' ? '#A78BFA' : '#64748B');
  }

  document.querySelectorAll('[data-node]').forEach(function (el) {
    el.addEventListener('click', function () {
      selectTopologyNode(el.getAttribute('data-node'));
    });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectTopologyNode(el.getAttribute('data-node'));
      }
    });
  });

  /* 8. IPv4 CIDR Subnet Calculator (Projects page) */
  var cidrInput = document.getElementById('cidr-input');
  var subnetForm = document.getElementById('subnet-form');
  var subnetErr = document.getElementById('subnet-error');
  var subnetOutput = document.getElementById('subnet-output');
  var subnetScope = document.getElementById('subnet-scope');
  var subnetDl = document.getElementById('subnet-dl');
  var presetBtns = Array.prototype.slice.call(document.querySelectorAll('.preset-btn'));
  var lastSummary = '';

  function ipToString(num) {
    return [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255].join('.');
  }

  function toBinaryOctets(num) {
    function pad(n) {
      return n.toString(2).padStart(8, '0');
    }
    return [pad((num >>> 24) & 255), pad((num >>> 16) & 255), pad((num >>> 8) & 255), pad(num & 255)].join('.');
  }

  function getScope(o) {
    if (o[0] === 10) return 'Private (RFC 1918 · Class A)';
    if (o[0] === 172 && o[1] >= 16 && o[1] <= 31) return 'Private (RFC 1918 · Class B)';
    if (o[0] === 192 && o[1] === 168) return 'Private (RFC 1918 · Class C)';
    if (o[0] === 127) return 'Loopback Range';
    if (o[0] === 169 && o[1] === 254) return 'Link-Local (APIPA)';
    if (o[0] >= 224 && o[0] <= 239) return 'Multicast (Class D)';
    return 'Public Routable IPv4';
  }

  function renderSubnet(value) {
    if (!subnetDl || !subnetErr || !subnetOutput) return;
    var trimmed = value.trim();
    var m = trimmed.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/);

    presetBtns.forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-cidr') === trimmed);
    });

    if (!m) {
      subnetErr.textContent = 'Error: Enter a valid IPv4 CIDR address, such as 192.168.10.37/26.';
      subnetErr.hidden = false;
      subnetOutput.hidden = true;
      return;
    }

    var o = m.slice(1, 5).map(Number);
    var prefix = Number(m[5]);
    if (o.some(function (x) { return x > 255; }) || prefix > 32) {
      subnetErr.textContent = 'Error: Each octet must be 0–255 and the prefix length must be 0–32.';
      subnetErr.hidden = false;
      subnetOutput.hidden = true;
      return;
    }

    subnetErr.hidden = true;
    subnetOutput.hidden = false;

    var addr = ((o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]) >>> 0;
    var mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    var wildcard = (~mask) >>> 0;
    var network = (addr & mask) >>> 0;
    var broadcast = (network | wildcard) >>> 0;
    var total = Math.pow(2, 32 - prefix);
    var usable = prefix >= 31 ? total : total - 2;
    var first = prefix >= 31 ? network : (network + 1) >>> 0;
    var last = prefix >= 31 ? broadcast : (broadcast - 1) >>> 0;

    var netStr = ipToString(network);
    var maskStr = ipToString(mask);
    var wildStr = ipToString(wildcard);
    var bcStr = ipToString(broadcast);
    var firstStr = ipToString(first);
    var lastStr = ipToString(last);
    var usableStr = usable.toLocaleString();
    var binStr = toBinaryOctets(mask);

    if (subnetScope) subnetScope.textContent = getScope(o);

    lastSummary = [
      'CIDR: ' + trimmed,
      'Network Address: ' + netStr,
      'Subnet Mask: ' + maskStr,
      'Wildcard Mask: ' + wildStr,
      'Broadcast Address: ' + bcStr,
      'Host Range: ' + firstStr + ' - ' + lastStr,
      'Usable Hosts: ' + usableStr,
    ].join('\n');

    var rows = [
      ['Network Address', netStr, 'accent-indigo'],
      ['Subnet Mask', maskStr, ''],
      ['Wildcard Mask', wildStr, ''],
      ['Broadcast Address', bcStr, ''],
      ['First Usable Host', firstStr, ''],
      ['Last Usable Host', lastStr, ''],
      ['Usable Hosts', usableStr, 'accent-teal'],
      ['Binary Mask', binStr, 'binary-val'],
    ];

    subnetDl.innerHTML = '';
    rows.forEach(function (r) {
      var wrap = document.createElement('div');
      var dt = document.createElement('dt');
      var dd = document.createElement('dd');
      dt.textContent = r[0];
      dd.textContent = r[1];
      if (r[2]) dd.className = r[2];
      wrap.appendChild(dt);
      wrap.appendChild(dd);
      subnetDl.appendChild(wrap);
    });
  }

  if (cidrInput) {
    cidrInput.addEventListener('input', function () {
      renderSubnet(cidrInput.value);
    });
    renderSubnet(cidrInput.value);
  }

  if (subnetForm) {
    subnetForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (cidrInput) renderSubnet(cidrInput.value);
    });
  }

  presetBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var cidr = btn.getAttribute('data-cidr');
      if (cidrInput && cidr) {
        cidrInput.value = cidr;
        renderSubnet(cidr);
      }
    });
  });

  var copySubnetBtn = document.getElementById('copy-subnet-btn');
  var copySubnetLabel = document.getElementById('copy-subnet-label');
  if (copySubnetBtn && copySubnetLabel) {
    copySubnetBtn.addEventListener('click', function () {
      if (!lastSummary || !navigator.clipboard) return;
      navigator.clipboard.writeText(lastSummary).then(function () {
        copySubnetLabel.textContent = 'Copied';
        window.setTimeout(function () {
          copySubnetLabel.textContent = 'Copy summary';
        }, 1800);
      });
    });
  }

  /* 9. Copy email button (Home & Contact pages) */
  var copyEmailBtn = document.getElementById('copy-email-btn');
  var copyEmailLabel = document.getElementById('copy-email-label');
  if (copyEmailBtn && copyEmailLabel) {
    var defaultCopyLabel = copyEmailLabel.textContent;
    copyEmailBtn.addEventListener('click', function () {
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText('mahindx727@gmail.com').then(function () {
        copyEmailLabel.textContent = 'Copied';
        window.setTimeout(function () {
          copyEmailLabel.textContent = defaultCopyLabel;
        }, 1800);
      });
    });
  }

  /* 10. Validated Contact Form (Contact page) */
  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    var nameInput = document.getElementById('contact-name');
    var emailInput = document.getElementById('contact-email');
    var orgInput = document.getElementById('contact-org');
    var topicSelect = document.getElementById('contact-topic');
    var messageInput = document.getElementById('contact-message');
    var msgCounter = document.getElementById('message-counter');
    var successBox = document.getElementById('contact-success');
    var summaryDl = document.getElementById('contact-summary-dl');
    var mailtoLink = document.getElementById('contact-mailto-link');
    var sendAnotherBtn = document.getElementById('send-another-btn');

    function setFieldError(inputEl, errId, message) {
      var errEl = document.getElementById(errId);
      if (inputEl) {
        if (message) {
          inputEl.setAttribute('aria-invalid', 'true');
        } else {
          inputEl.removeAttribute('aria-invalid');
        }
      }
      if (errEl) {
        errEl.textContent = message || '';
        errEl.hidden = !message;
      }
    }

    function updateCounter() {
      if (msgCounter && messageInput) {
        msgCounter.textContent = messageInput.value.length + ' / 600';
      }
    }

    if (messageInput) {
      messageInput.addEventListener('input', updateCounter);
      updateCounter();
    }

    function validateContactForm() {
      var valid = true;
      var firstInvalid = null;

      var nameVal = nameInput ? nameInput.value.trim() : '';
      if (nameVal.length < 2) {
        setFieldError(nameInput, 'err-name', 'Please enter your full name (at least 2 characters).');
        valid = false;
        firstInvalid = firstInvalid || nameInput;
      } else {
        setFieldError(nameInput, 'err-name', '');
      }

      var emailVal = emailInput ? emailInput.value.trim() : '';
      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailPattern.test(emailVal)) {
        setFieldError(emailInput, 'err-email', 'Please enter a valid email address.');
        valid = false;
        firstInvalid = firstInvalid || emailInput;
      } else {
        setFieldError(emailInput, 'err-email', '');
      }

      var topicVal = topicSelect ? topicSelect.value : '';
      if (!topicVal) {
        setFieldError(topicSelect, 'err-topic', 'Please choose an inquiry category.');
        valid = false;
        firstInvalid = firstInvalid || topicSelect;
      } else {
        setFieldError(topicSelect, 'err-topic', '');
      }

      var selectedReply = contactForm.querySelector('input[name="replyMethod"]:checked');
      if (!selectedReply) {
        setFieldError(null, 'err-reply', 'Please select your preferred reply method.');
        valid = false;
      } else {
        setFieldError(null, 'err-reply', '');
      }

      var checkedInterests = Array.prototype.slice
        .call(contactForm.querySelectorAll('input[name="interests"]:checked'))
        .map(function (cb) { return cb.value; });
      if (checkedInterests.length === 0) {
        setFieldError(null, 'err-interests', 'Please select at least one area of interest.');
        valid = false;
      } else {
        setFieldError(null, 'err-interests', '');
      }

      var messageVal = messageInput ? messageInput.value.trim() : '';
      if (messageVal.length < 15) {
        setFieldError(messageInput, 'err-message', 'Please write a message of at least 15 characters.');
        valid = false;
        firstInvalid = firstInvalid || messageInput;
      } else {
        setFieldError(messageInput, 'err-message', '');
      }

      if (!valid && firstInvalid) {
        firstInvalid.focus();
      }

      return {
        valid: valid,
        data: {
          name: nameVal,
          email: emailVal,
          organization: orgInput ? orgInput.value.trim() || 'Not specified' : 'Not specified',
          topic: topicVal,
          replyMethod: selectedReply ? selectedReply.value : 'Email',
          interests: checkedInterests.join(', '),
          message: messageVal,
        },
      };
    }

    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var result = validateContactForm();
      if (!result.valid) {
        if (successBox) successBox.hidden = true;
        return;
      }

      if (summaryDl) {
        summaryDl.innerHTML = '';
        var summaryRows = [
          ['Full Name', result.data.name],
          ['Email Address', result.data.email],
          ['Organization', result.data.organization],
          ['Category', result.data.topic],
          ['Preferred Reply', result.data.replyMethod],
          ['Interests', result.data.interests],
          ['Message', result.data.message],
        ];
        summaryRows.forEach(function (pair) {
          var row = document.createElement('div');
          var dt = document.createElement('dt');
          var dd = document.createElement('dd');
          dt.textContent = pair[0];
          dd.textContent = pair[1];
          row.appendChild(dt);
          row.appendChild(dd);
          summaryDl.appendChild(row);
        });
      }

      if (mailtoLink) {
        var subject = encodeURIComponent('[' + result.data.topic + '] Inquiry from ' + result.data.name);
        var body = encodeURIComponent(
          'Name: ' + result.data.name +
          '\nEmail: ' + result.data.email +
          '\nOrganization: ' + result.data.organization +
          '\nPreferred Reply: ' + result.data.replyMethod +
          '\nInterests: ' + result.data.interests +
          '\n\nMessage:\n' + result.data.message
        );
        mailtoLink.setAttribute('href', 'mailto:mahindx727@gmail.com?subject=' + subject + '&body=' + body);
      }

      if (successBox) {
        successBox.hidden = false;
        successBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });

    contactForm.addEventListener('reset', function () {
      window.setTimeout(function () {
        setFieldError(nameInput, 'err-name', '');
        setFieldError(emailInput, 'err-email', '');
        setFieldError(topicSelect, 'err-topic', '');
        setFieldError(null, 'err-reply', '');
        setFieldError(null, 'err-interests', '');
        setFieldError(messageInput, 'err-message', '');
        if (successBox) successBox.hidden = true;
        updateCounter();
      }, 0);
    });

    if (sendAnotherBtn) {
      sendAnotherBtn.addEventListener('click', function () {
        contactForm.reset();
        if (nameInput) nameInput.focus();
      });
    }
  }
})();


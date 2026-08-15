/* ============================================================
   HAVANA STONES — Main JS
   ============================================================ */

(function () {
  "use strict";

  /* ---------- Header scroll state ---------- */
  const header = document.querySelector(".site-header");
  const onScroll = () => {
    if (window.scrollY > 40) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav ---------- */
  const burger = document.querySelector(".burger");
  const mobileNav = document.querySelector(".mobile-nav");
  if (burger && mobileNav) {
    burger.addEventListener("click", () => {
      const open = mobileNav.classList.toggle("open");
      document.body.style.overflow = open ? "hidden" : "";
      burger.setAttribute("aria-expanded", open);
    });
    mobileNav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        mobileNav.classList.remove("open");
        document.body.style.overflow = "";
      })
    );
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("visible"));
  }

  /* ---------- Generic filter system ---------- */
  // Elements with [data-filter] buttons and [data-category] cards
  document.querySelectorAll("[data-filter-group]").forEach((group) => {
    const buttons = group.querySelectorAll(".filter-btn");
    const cards = group.querySelectorAll("[data-category]");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const filter = btn.getAttribute("data-filter");
        cards.forEach((card) => {
          const cats = (card.getAttribute("data-category") || "").split(" ");
          const show = filter === "all" || cats.includes(filter);
          card.style.display = show ? "" : "none";
        });
      });
    });
  });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-item").forEach((item) => {
    const q = item.querySelector(".faq-q");
    q.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach((o) => {
        o.classList.remove("open");
        o.querySelector(".faq-a").style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add("open");
        const a = item.querySelector(".faq-a");
        a.style.maxHeight = a.scrollHeight + "px";
      }
    });
  });

  /* ---------- Forms (demo submit) ---------- */
  document.querySelectorAll("form[data-demo]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const original = btn.textContent;
      btn.textContent = "Sending…";
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = "Request sent ✓";
        setTimeout(() => {
          btn.textContent = original;
          btn.disabled = false;
          form.reset();
        }, 2200);
      }, 900);
    });
  });

  /* ---------- File drop label ---------- */
  document.querySelectorAll(".file-drop input[type=file]").forEach((input) => {
    input.addEventListener("change", () => {
      const label = input.closest(".file-drop");
      const name = input.files && input.files[0] ? input.files[0].name : "No file selected";
      const txt = label.querySelector(".file-name");
      if (txt) txt.textContent = name;
    });
  });

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  /* ============================================================
     CART SYSTEM
     ============================================================ */
  const CART_KEY = "havana_cart";
  const PRICE_PER_SQM = 27; // € per m²

  let cart = [];
  try {
    cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (e) {
    cart = [];
  }

  function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    renderCart();
    updateBadge();
  }

  function updateBadge() {
    const count = cart.reduce((s, i) => s + i.qty, 0);
    document.querySelectorAll(".cart-badge").forEach((b) => {
      b.textContent = count;
      b.style.display = count > 0 ? "grid" : "none";
    });
  }

  function renderCart() {
    const itemsEl = document.querySelector(".cart-items");
    const totalEl = document.querySelector(".cart-total b");
    if (!itemsEl) return;

    if (cart.length === 0) {
      itemsEl.innerHTML = '<div class="cart-empty">Your cart is empty.<br>Add some beautiful stone.</div>';
    } else {
      itemsEl.innerHTML = cart
        .map(
          (item, idx) => `
        <div class="cart-item">
          <img src="${item.img}" alt="${item.name}" />
          <div class="cart-item-info">
            <h4>${item.name}</h4>
            <div class="price">€${(item.price * item.qty).toFixed(2)}</div>
            <div class="cart-item-qty">
              <button data-dec="${idx}" aria-label="Decrease">−</button>
              <span>${item.qty} m²</span>
              <button data-inc="${idx}" aria-label="Increase">+</button>
            </div>
          </div>
          <button class="cart-item-remove" data-remove="${idx}">Remove</button>
        </div>`
        )
        .join("");
    }

    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    if (totalEl) totalEl.textContent = "€" + total.toFixed(2);

    // wire cart item controls
    itemsEl.querySelectorAll("[data-inc]").forEach((btn) => {
      btn.addEventListener("click", () => {
        cart[+btn.dataset.inc].qty++;
        saveCart();
      });
    });
    itemsEl.querySelectorAll("[data-dec]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = +btn.dataset.dec;
        if (cart[i].qty > 1) cart[i].qty--;
        else cart.splice(i, 1);
        saveCart();
      });
    });
    itemsEl.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", () => {
        cart.splice(+btn.dataset.remove, 1);
        saveCart();
      });
    });
  }

  function openCart() {
    document.querySelector(".cart-overlay").classList.add("open");
    document.querySelector(".cart-drawer").classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeCart() {
    document.querySelector(".cart-overlay").classList.remove("open");
    document.querySelector(".cart-drawer").classList.remove("open");
    document.body.style.overflow = "";
  }

  // Cart open/close
  document.querySelectorAll("[data-cart-open]").forEach((el) =>
    el.addEventListener("click", openCart)
  );
  document.querySelectorAll("[data-cart-close]").forEach((el) =>
    el.addEventListener("click", closeCart)
  );
  const overlay = document.querySelector(".cart-overlay");
  if (overlay) overlay.addEventListener("click", closeCart);

  // Add to cart buttons
  document.querySelectorAll(".add-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".product-card");
      const name = card.getAttribute("data-name");
      const img = card.getAttribute("data-img");
      const qtyInput = card.querySelector(".qty input");
      const qty = parseInt(qtyInput.value, 10) || 1;

      const existing = cart.find((i) => i.name === name);
      if (existing) {
        existing.qty += qty;
      } else {
        cart.push({ name, img, price: PRICE_PER_SQM, qty });
      }
      saveCart();

      // feedback
      btn.classList.add("added");
      const original = btn.innerHTML;
      btn.innerHTML = "✓ Added";
      setTimeout(() => {
        btn.classList.remove("added");
        btn.innerHTML = original;
      }, 1400);
    });
  });

  // Quantity +/- buttons on product cards
  document.querySelectorAll(".qty").forEach((qty) => {
    const input = qty.querySelector("input");
    qty.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        let v = parseInt(input.value, 10) || 1;
        v = btn.getAttribute("data-dir") === "up" ? v + 1 : Math.max(1, v - 1);
        input.value = v;
      });
    });
  });

  // Checkout -> quote page
  document.querySelectorAll("[data-checkout]").forEach((el) => {
    el.addEventListener("click", () => {
      const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
      const summary = cart.map((i) => `${i.name} x${i.qty} m²`).join(", ");
      const url =
        "quote.html?cart=" +
        encodeURIComponent(summary) +
        "&total=" +
        encodeURIComponent("€" + total.toFixed(2));
      window.location.href = url;
    });
  });

  // Init
  renderCart();
  updateBadge();
})();

<!doctype html>
<html lang="it">
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
  <head>
    <title>Merchandise — ITS Lazio Digital Gaming</title>
    <link rel="stylesheet" href="../condivisi/headerdarkmode.css">
    <link rel="stylesheet" href="./merchandise.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&family=Inter:wght@400;500&display=swap" rel="stylesheet">
  </head>
  <body>

    <!-- HEADER -->
    <header>
      <a href="../index.html"><img src="../photo/Logo_Laziodigital.png" alt="logo"/></a>
      <nav>
    <div class="nav-links" id="navLinks">
        <a href="../info/info.html">Info</a>
        <a href="../calendario/calendario.html">Calendario</a>
        <a href="../classifica/classifica.html">Classifica</a>
        <a href="../news/news.html">News</a>
        <a href="../live/live.html">Live</a>
        <a href="../merchandise/merchandise.php">Shop</a>
        <a href="../iscrizione/iscrizione.html">Partecipa</a>
        <a href="../admin_area/login.php" id="linkDashboard" style="display: none;">Dashboard</a>
    </div>
    <label class="switch" title="Toggle dark mode">
          <input type="checkbox" id="darkModeToggle">
          <span class="track"></span>
          <span class="thumb"></span>
        </label>
    <button class="hamburger" id="hamburger" aria-label="Apri menu" aria-expanded="false">
      <span></span>
      <span></span>
      <span></span>
    </button>
  </nav>
    </header>

    <!-- PROMO BANNER -->
    <div class="promo-banner">
      🎮 Spedizione gratuita per ordini superiori a <span>€50</span> &nbsp;·&nbsp; Ritiro disponibile in sede
    </div>

    <!-- HERO -->
    <div class="merch-hero">
      <div class="merch-hero-eyebrow">ITS Lazio Digital Gaming</div>
      <h1>OFFICIAL <span>SHOP</span></h1>
      <p>Rappresenta il torneo con stile. Abbigliamento e accessori ufficiali del team.</p>
    </div>

    <!-- SHOP -->
    <div class="shop-wrapper">

      <!-- LEFT: Products -->
      <div>
        <div class="filter-bar" id="filterBar">
          <button class="filter-btn active" data-cat="all">Tutto</button>
          <button class="filter-btn" data-cat="abbigliamento">Abbigliamento</button>
          <button class="filter-btn" data-cat="accessori">Accessori</button>
          <button class="filter-btn" data-cat="gadget">Gadget</button>
        </div>

        <div class="section-head">
          <div class="section-eyebrow">Collezione 2026</div>
          <h2 class="section-title">Shop Ufficiale</h2>
        </div>

        <div class="product-grid" id="productGrid"></div>
      </div>

      <!-- RIGHT: Cart -->
      <div class="cart-sidebar">
        <div class="cart-box">
          <div class="cart-header">
            <span class="cart-title">Carrello</span>
            <span class="cart-count-badge" id="cartBadge">0</span>
          </div>
          <div class="cart-items" id="cartItems">
            <div class="cart-empty" id="cartEmpty">Nessun articolo nel carrello</div>
          </div>
          <div class="cart-footer">
            <div class="cart-total-row">
              <span class="cart-total-label">Totale</span>
              <span class="cart-total-val" id="cartTotal">€0.00</span>
            </div>
            <button class="checkout-btn" id="checkoutBtn" disabled onclick="openCheckout()">
              Procedi all'acquisto →
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- CHECKOUT MODAL -->
    <div class="modal-overlay" id="checkoutModal">
      <div class="modal">
        <div class="modal-top">
          <span class="modal-title">Checkout</span>
          <button class="modal-close" onclick="closeCheckout()">✕</button>
        </div>

        <div class="modal-body" id="checkoutForm">
          <!-- Order Summary -->
          <p class="modal-section-title">Riepilogo Ordine</p>
          <div id="orderSummary"></div>

          <br>
          <!-- Personal Info -->
          <p class="modal-section-title">Dati Personali</p>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Nome *</label>
              <input class="form-input" type="text" id="firstName" placeholder="Mario" required>
            </div>
            <div class="form-group">
              <label class="form-label">Cognome *</label>
              <input class="form-input" type="text" id="lastName" placeholder="Rossi" required>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Email *</label>
            <input class="form-input" type="email" id="email" placeholder="mario@example.com" required>
          </div>
          <div class="form-group">
            <label class="form-label">Telefono</label>
            <input class="form-input" type="tel" id="phone" placeholder="+39 333 000 0000">
          </div>

          <br>
          <!-- Delivery -->
          <p class="modal-section-title">Spedizione</p>
          <div class="form-group">
            <label class="form-label">Indirizzo *</label>
            <input class="form-input" type="text" id="address" placeholder="Via Roma, 1" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Città *</label>
              <input class="form-input" type="text" id="city" placeholder="Roma" required>
            </div>
            <div class="form-group">
              <label class="form-label">CAP *</label>
              <input class="form-input" type="text" id="zip" placeholder="00100" required maxlength="5">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Note (opzionale)</label>
            <input class="form-input" type="text" id="notes" placeholder="Citofono, istruzioni...">
          </div>

          <button class="submit-btn" onclick="submitOrder()">Conferma Ordine →</button>
        </div>

        <!-- Success State -->
        <div class="success-screen" id="successScreen">
          <span class="success-icon">🎉</span>
          <h2>Ordine Confermato!</h2>
          <p>Grazie per il tuo acquisto! Riceverai un'email di conferma a breve con i dettagli della spedizione.</p>
          <button class="success-close-btn" onclick="closeCheckout()">Torna allo shop</button>
        </div>
      </div>
    </div>

    <!-- FOOTER -->
    <footer class="site-footer">
      <div class="footer-left">
        <p><a href="../admin_area/login.php" class="hidden-link">Area riservata</a></p>
      </div>
      <div class="footer-center">
        <p class="footer-title">Torneo ITS Lazio Digital Gaming</p>
        <p class="footer-copy">© 2026 All rights reserved.</p>
        <p><a href="../admin_area/login.php">Area riservata</a></p>
      </div>
      <div class="footer-right">
        <p><a href="tel:+393281693209">☎ Ivan He — +39 328 169 3209</a></p>
        <p><a href="tel:+393518152561">☎ Emanuele Campus — +39 351 815 2561</a></p>
        <p><a href="mailto:itstorneoesports@gmail.com">&#9993; itstorneoesports@gmail.com</a></p>
      </div>
    </footer>


  </body>
      <script src="../condivisi/darkmode.js"></script>
    <script src="./merchandise.js"></script>
    <script src="../check_admin.js"></script>

</html>
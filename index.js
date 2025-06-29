document.addEventListener("DOMContentLoaded", () => {
    // --- Mobile Navigation Toggle ---
    const navButton = document.querySelector(".nav-button");
    const navbarCollapse = document.querySelector("#navbarNav"); // Target Bootstrap's collapsible div

    if (navButton && navbarCollapse) {
        navButton.addEventListener("click", () => {
            navButton.blur(); // Remove focus from the button after click
        });

        // Close navbar when a nav link is clicked (for single-page apps)
        document.querySelectorAll(".navbar-nav .nav-link").forEach(link => {
            link.addEventListener("click", () => {
                if (navbarCollapse.classList.contains("show")) {
                    const bsCollapse = new bootstrap.Collapse(navbarCollapse, {
                        toggle: false
                    });
                    bsCollapse.hide();
                }
            });
        });
    }

    // --- Active Nav Link on Scroll ---
    const sections = document.querySelectorAll("section");
    const navLinks = document.querySelectorAll(".navbar-nav .nav-link");

    const activateNavLink = () => {
        let current = "";
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            // Adjust offset to trigger active state a bit before section fully enters view
            if (scrollY >= sectionTop - sectionHeight / 3) {
                current = section.getAttribute("id");
            }
        });

        navLinks.forEach(link => {
            link.classList.remove("active");
            if (link.getAttribute("href").includes(current)) {
                link.classList.add("active");
            }
        });
    };

    window.addEventListener("scroll", activateNavLink);
    activateNavLink(); // Call on load to set initial active link

    // --- Header Scroll Shadow ---
    const header = document.querySelector(".header");
    if (header) {
        window.addEventListener("scroll", () => {
            if (window.scrollY > 0) {
                header.classList.add("scrolled"); // Add 'scrolled' class
            } else {
                header.classList.remove("scrolled"); // Remove 'scrolled' class
            }
        });
        // Check on load in case user refreshed while scrolled down
        if (window.scrollY > 0) {
            header.classList.add("scrolled");
        }
    }

    // --- Scroll Reveal Animation ---
    // Make sure 'home-section h1' and other elements have the 'hidden' class initially in HTML
    const hiddenElements = document.querySelectorAll(
        ".home-section h1, .home-section .custom-btn, .social-icons, .home-blob, " +
        ".about-section .row > div, .skill-data, .project-card, .contact-form, " +
        ".footer-title, .footer-social, .footer-copy"
    );

    const observerOptions = {
        root: null, // viewport as root
        rootMargin: '0px',
        threshold: 0.1 // 10% of element visible to trigger
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                // The skill bar animation is now purely CSS-driven.
                // The 'visible' class on .skill-data will trigger its child .skill-bar animation.
                observer.unobserve(entry.target); // Stop observing once visible
            }
        });
    }, observerOptions);

    hiddenElements.forEach(el => {
        el.classList.add("hidden"); // Add hidden class initially
        observer.observe(el);
    });

let typingEffect = new Typed("#text", {
    strings: ["A Programmer", "A Coder", ], // Added "A" for better flow and "Your Friendly AI"
    loop: true,
    typeSpeed: 70,   // Slightly faster typing for a snappier feel
    backSpeed: 40,   // Slightly faster backspacing
    backDelay: 1200, // Slightly longer delay before backspacing
    startDelay: 500, // New: Delay before the first string starts typing
    fadeOut: true,   // New: Fades out the text before starting the next string
    fadeOutClass: 'typed-fade-out', // New: CSS class for fade out animation
    showCursor: true, // New: Explicitly show the typing cursor
    cursorChar: '|', // New: Change the cursor character
    onComplete: (self) => {
        // New: Callback function when the typing animation completes a full loop
        console.log("Typing cycle completed!");
        // You could add more logic here, like triggering another animation or logging analytics
    },
    preStringTyped: (arrayPos, self) => {
        // New: Callback before a new string starts typing
        console.log(`Starting to type: ${self.strings[arrayPos]}`);
    },
    onLastStringBackspaced: (self) => {
        // New: Callback when the last string has been backspaced
        console.log("Last string backspaced, starting loop again!");
    }
});

    // The previous problematic JavaScript logic for skill bars is completely removed.
    // CSS handles the animation when the '.visible' class is added by the IntersectionObserver.
});
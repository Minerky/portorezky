document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');
    let isMenuOpen = false;

    function toggleMenu() {
        isMenuOpen = !isMenuOpen;
        if (isMenuOpen) {
            mobileMenu.classList.add('active');
            mobileMenuBtn.innerHTML = '<i class="ph ph-x"></i>';
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        } else {
            mobileMenu.classList.remove('active');
            mobileMenuBtn.innerHTML = '<i class="ph ph-list"></i>';
            document.body.style.overflow = ''; // Allow scrolling
        }
    }

    mobileMenuBtn.addEventListener('click', toggleMenu);

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (isMenuOpen) toggleMenu();
        });
    });

    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    let lastScrollTop = 0;

    window.addEventListener('scroll', () => {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 50) {
            navbar.style.boxShadow = '0 10px 30px -10px rgba(0, 0, 0, 0.5)';
            navbar.style.backgroundColor = 'rgba(5, 8, 16, 0.85)';
            navbar.style.backdropFilter = 'blur(16px)';
            navbar.style.webkitBackdropFilter = 'blur(16px)';
            navbar.style.border = '1px solid var(--glass-border)';
        } else {
            navbar.style.boxShadow = 'none';
            navbar.style.backgroundColor = 'transparent';
            navbar.style.backdropFilter = 'none';
            navbar.style.webkitBackdropFilter = 'none';
            navbar.style.border = '1px solid transparent';
        }

        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scroll Down
            navbar.classList.add('scroll-down');
            navbar.classList.remove('scroll-up');
        } else {
            // Scroll Up
            navbar.classList.add('scroll-up');
            navbar.classList.remove('scroll-down');
        }
        lastScrollTop = scrollTop;
    });

    // Scroll Animations using Intersection Observer
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // Stop observing once visible
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.fade-in-up, .slide-in-left, .slide-in-right');
    animatedElements.forEach(el => {
        observer.observe(el);
    });

    // Portfolio Filter Logic
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            projectCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                if (filterValue === 'all' || cardCategory === filterValue) {
                    card.classList.remove('is-hidden');
                } else {
                    card.classList.add('is-hidden');
                }
            });
        });
    });

    // Reading Progress Bar & Back to Top & ScrollSpy
    const progressBar = document.getElementById('scrollProgress');
    const backToTopBtn = document.getElementById('backToTop');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');

    window.addEventListener('scroll', () => {
        const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        
        if (progressBar) {
            progressBar.style.width = scrolled + '%';
        }

        // Back to top visibility
        if (winScroll > 400) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }

        // ScrollSpy Navigation
        let currentSection = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            const sectionHeight = section.clientHeight;
            if (winScroll >= sectionTop && winScroll < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    });

    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Initial Trigger for Hero Section
    setTimeout(() => {
        const hero = document.querySelector('.hero');
        if (hero) hero.classList.add('is-visible');
    }, 100);

    // Document Lightbox Modal Logic with Custom In-House PDF Engine
    const docModal = document.getElementById('docModal');
    const docModalOverlay = document.getElementById('docModalOverlay');
    const docModalContent = document.querySelector('.doc-modal-content');
    const docModalClose = document.getElementById('docModalClose');
    const docModalTitle = document.getElementById('docModalTitle');
    const docModalExternal = document.getElementById('docModalExternal');
    const docModalBody = document.getElementById('docModalBody');
    const pdfControls = document.getElementById('pdfControls');
    const pdfPrevBtn = document.getElementById('pdfPrevBtn');
    const pdfNextBtn = document.getElementById('pdfNextBtn');
    const pdfPageNum = document.getElementById('pdfPageNum');
    const pdfPageCount = document.getElementById('pdfPageCount');
    const pdfZoomInBtn = document.getElementById('pdfZoomInBtn');
    const pdfZoomOutBtn = document.getElementById('pdfZoomOutBtn');
    const pdfZoomVal = document.getElementById('pdfZoomVal');
    const pdfFitBtn = document.getElementById('pdfFitBtn');
    const viewDocButtons = document.querySelectorAll('.view-doc-btn');

    // PDF.js State Variables
    let pdfDoc = null;
    let pdfCurrentPage = 1;
    let pdfTotalPages = 1;
    let pdfScale = 1.35;
    let pdfRendering = false;
    let pdfPagePending = null;
    let currentRenderTask = null;
    let currentCanvas = null;

    if (window.pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    function renderPdfPage(num) {
        if (!pdfDoc || !currentCanvas) return;
        pdfRendering = true;

        if (currentRenderTask) {
            currentRenderTask.cancel();
        }

        pdfDoc.getPage(num).then(page => {
            const ctx = currentCanvas.getContext('2d');
            const dpr = window.devicePixelRatio || 1;
            const viewport = page.getViewport({ scale: pdfScale });

            currentCanvas.height = viewport.height * dpr;
            currentCanvas.width = viewport.width * dpr;
            currentCanvas.style.height = viewport.height + 'px';
            currentCanvas.style.width = viewport.width + 'px';

            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(dpr, dpr);

            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };

            currentRenderTask = page.render(renderContext);
            currentRenderTask.promise.then(() => {
                pdfRendering = false;
                currentRenderTask = null;
                if (pdfPagePending !== null) {
                    renderPdfPage(pdfPagePending);
                    pdfPagePending = null;
                }
            }).catch(err => {
                if (err && err.name !== 'RenderingCancelledException') {
                    console.error('PDF render error:', err);
                }
                pdfRendering = false;
            });
        }).catch(err => {
            console.error('PDF getPage error:', err);
            pdfRendering = false;
        });

        if (pdfPageNum) pdfPageNum.textContent = num;
        if (pdfZoomVal) pdfZoomVal.textContent = Math.round((pdfScale / 1.35) * 100) + '%';
        if (pdfPrevBtn) pdfPrevBtn.disabled = num <= 1;
        if (pdfNextBtn) pdfNextBtn.disabled = num >= pdfTotalPages;
    }

    function queuePdfPage(num) {
        if (pdfRendering) {
            pdfPagePending = num;
        } else {
            renderPdfPage(num);
        }
    }

    function fitPdfWidth() {
        if (!pdfDoc) return;
        pdfDoc.getPage(pdfCurrentPage).then(page => {
            const baseViewport = page.getViewport({ scale: 1.0 });
            const containerWidth = docModalBody.clientWidth - 48;
            if (containerWidth > 300) {
                pdfScale = Math.max(0.6, Math.min(2.5, containerWidth / baseViewport.width));
                renderPdfPage(pdfCurrentPage);
            }
        });
    }

    function loadCustomPdf(url) {
        docModalBody.innerHTML = `
            <div class="pdf-canvas-wrapper" id="pdfCanvasWrapper">
                <div class="pdf-loading-spinner" id="pdfSpinner">
                    <i class="ph ph-spinner ph-spin" style="font-size:24px;"></i> Memuat PDF...
                </div>
            </div>
        `;

        if (!window.pdfjsLib) {
            docModalBody.innerHTML = `<div style="color:var(--text-secondary); padding:40px; text-align:center;">Library PDF viewer sedang disiapkan... Silakan buka via tab baru.</div>`;
            return;
        }

        const loadingTask = pdfjsLib.getDocument(url);
        loadingTask.promise.then(pdf => {
            pdfDoc = pdf;
            pdfTotalPages = pdf.numPages;
            pdfCurrentPage = 1;
            if (pdfPageCount) pdfPageCount.textContent = pdfTotalPages;
            if (pdfControls) pdfControls.style.display = 'inline-flex';

            const wrapper = document.getElementById('pdfCanvasWrapper');
            if (wrapper) {
                wrapper.innerHTML = '';
                currentCanvas = document.createElement('canvas');
                currentCanvas.className = 'doc-modal-canvas';
                wrapper.appendChild(currentCanvas);

                // Auto fit width
                pdfDoc.getPage(1).then(page => {
                    const baseViewport = page.getViewport({ scale: 1.0 });
                    const containerWidth = docModalBody.clientWidth - 48;
                    if (containerWidth > 300) {
                        pdfScale = Math.max(0.6, Math.min(2.0, (containerWidth) / baseViewport.width));
                    } else {
                        pdfScale = 1.0;
                    }
                    renderPdfPage(1);
                });
            }
        }).catch(err => {
            console.error('Failed to load PDF: ', err);
            docModalBody.innerHTML = `
                <div style="color:#ff5252; padding:40px; text-align:center; font-family:var(--font-heading);">
                    Gagal memuat PDF ke dalam canvas viewer.<br>
                    <a href="${url}" target="_blank" style="color:var(--accent); text-decoration:underline; display:inline-block; margin-top:10px;">Buka file asli di tab baru</a>
                </div>
            `;
        });
    }

    function openDocModal(src, title, type) {
        if (!docModal || !src) return;
        
        if (docModalTitle) docModalTitle.textContent = title || 'Dokumen';
        if (docModalExternal) docModalExternal.href = src;
        
        if (type === 'pdf') {
            if (docModalContent) docModalContent.classList.add('is-pdf');
            loadCustomPdf(src);
        } else {
            if (docModalContent) docModalContent.classList.remove('is-pdf');
            if (pdfControls) pdfControls.style.display = 'none';
            if (docModalBody) {
                docModalBody.innerHTML = `
                    <img src="${src}" alt="${title || 'Dokumen Gambar'}" class="doc-modal-image">
                `;
            }
        }

        docModal.classList.add('active');
        docModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeDocModal() {
        if (!docModal) return;
        docModal.classList.remove('active');
        docModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (docModalContent) {
            docModalContent.classList.remove('is-pdf');
        }
        if (pdfControls) {
            pdfControls.style.display = 'none';
        }
        if (currentRenderTask) {
            currentRenderTask.cancel();
            currentRenderTask = null;
        }
        pdfDoc = null;
        currentCanvas = null;
        setTimeout(() => {
            if (docModalBody) docModalBody.innerHTML = '';
        }, 250);
    }

    // PDF Controls Event Listeners
    if (pdfPrevBtn) {
        pdfPrevBtn.addEventListener('click', () => {
            if (pdfCurrentPage <= 1) return;
            pdfCurrentPage--;
            queuePdfPage(pdfCurrentPage);
        });
    }

    if (pdfNextBtn) {
        pdfNextBtn.addEventListener('click', () => {
            if (!pdfDoc || pdfCurrentPage >= pdfTotalPages) return;
            pdfCurrentPage++;
            queuePdfPage(pdfCurrentPage);
        });
    }

    if (pdfZoomInBtn) {
        pdfZoomInBtn.addEventListener('click', () => {
            if (pdfScale >= 3.0) return;
            pdfScale += 0.2;
            queuePdfPage(pdfCurrentPage);
        });
    }

    if (pdfZoomOutBtn) {
        pdfZoomOutBtn.addEventListener('click', () => {
            if (pdfScale <= 0.5) return;
            pdfScale -= 0.2;
            queuePdfPage(pdfCurrentPage);
        });
    }

    if (pdfFitBtn) {
        pdfFitBtn.addEventListener('click', () => {
            fitPdfWidth();
        });
    }

    viewDocButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const src = btn.getAttribute('data-src');
            const title = btn.getAttribute('data-title');
            const type = btn.getAttribute('data-type') || (src && src.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image');
            if (src) {
                openDocModal(src, title, type);
            }
        });
    });

    if (docModalClose) docModalClose.addEventListener('click', closeDocModal);
    if (docModalOverlay) docModalOverlay.addEventListener('click', closeDocModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && docModal && docModal.classList.contains('active')) {
            closeDocModal();
        }
    });
});

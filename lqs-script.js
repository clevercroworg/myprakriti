document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the LQS page
    const lqsForm = document.getElementById('lqs-form');
    if (!lqsForm) return;

    // Wizard Variables
    let currentStep = 1;
    const totalSteps = 5;
    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');
    const btnSubmit = document.getElementById('btn-submit');
    const progressBar = document.getElementById('wizard-bar');

    // UI Updating function for wizard steps
    function updateWizard() {
        // Toggle Steps visibility
        document.querySelectorAll('.wizard-step').forEach((step, idx) => {
            if (idx + 1 === currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });

        // Update Indicators
        document.querySelectorAll('.wizard-step-indicator').forEach((ind, idx) => {
            if (idx + 1 === currentStep) {
                ind.classList.add('active');
                ind.classList.remove('completed');
            } else if (idx + 1 < currentStep) {
                ind.classList.add('completed');
                ind.classList.remove('active');
            } else {
                ind.classList.remove('active', 'completed');
            }
        });

        // Update Progress Bar
        const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
        progressBar.style.width = progressPercentage + '%';

        // Toggle Buttons
        if (currentStep === 1) {
            btnPrev.style.display = 'none';
        } else {
            btnPrev.style.display = 'flex';
        }

        if (currentStep === totalSteps) {
            btnNext.style.display = 'none';
            btnSubmit.style.display = 'flex';
        } else {
            btnNext.style.display = 'flex';
            btnSubmit.style.display = 'none';
        }
    }

    // Validation
    function validateCurrentStep() {
        // Find inputs in the current step and check validity manually to ensure visual feedback
        const currentStepEl = document.getElementById(`step-${currentStep}`);
        const checkedCount = currentStepEl.querySelectorAll('input[type="radio"]:checked').length;
        
        // Each domain has exactly 5 questions
        if (checkedCount < 5) {
            alert('Please answer all 5 questions in this domain before proceeding.');
            return false;
        }
        return true;
    }

    btnNext.addEventListener('click', () => {
        if (validateCurrentStep()) {
            currentStep++;
            updateWizard();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    btnPrev.addEventListener('click', () => {
        currentStep--;
        updateWizard();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Scoring Logic Helper
    function getCategoryForDomain(scorePct) {
        if (scorePct <= 40) return { label: 'Critical', class: 'critical', desc: 'Immediate clinical intervention needed' };
        if (scorePct <= 60) return { label: 'Moderate', class: 'moderate', desc: 'Significant improvement opportunities' };
        if (scorePct <= 80) return { label: 'Good', class: 'good', desc: 'On track, fine-tuning recommended' };
        return { label: 'Excellent', class: 'excellent', desc: 'Maintain and support other domains' };
    }

    function getCategoryForLQS(scorePct) {
        if (scorePct <= 39) return { label: 'Critical', class: 'critical', action: 'Comprehensive multi-domain intervention needed urgently. Prioritise by lowest domain scores.' };
        if (scorePct <= 59) return { label: 'Needs Attention', class: 'needs-attention', action: 'Multiple domains below target. Structured nutrition and lifestyle counselling recommended.' };
        if (scorePct <= 74) return { label: 'Moderate', class: 'moderate', action: 'Foundation is building. Target the 1–2 lowest domains with specific behaviour-change strategies.' };
        if (scorePct <= 89) return { label: 'Good', class: 'good', action: 'Strong foundation. Continue current practices and optimise remaining gaps.' };
        return { label: 'Excellent', class: 'excellent', action: 'Maintain current behaviours. Schedule periodic reassessment every 3–6 months.' };
    }

    function applyCardUI(domainNum, pct, category) {
        const card = document.getElementById(`card-d${domainNum}`);
        const badge = document.getElementById(`badge-d${domainNum}`);
        const prog = document.getElementById(`prog-d${domainNum}`);
        const res = document.getElementById(`res-d${domainNum}`);

        // Set value
        res.setAttribute('data-target', pct);

        // Reset classes
        badge.className = 'metric-badge';
        prog.className = 'metric-progress';
        card.style.borderTopColor = 'transparent';

        // Apply new classes
        badge.classList.add(`badge-${category.class}`);
        badge.textContent = `${category.label} - ${category.desc}`;
        prog.classList.add(`progress-${category.class}`);
        prog.style.width = pct + '%';
        
        // Simple color mapping for border top
        let bColor = '#ef4444'; // critical (red)
        if (category.class === 'moderate') bColor = '#eab308'; // yellow
        if (category.class === 'good') bColor = '#10b981'; // green
        if (category.class === 'excellent') bColor = '#3b82f6'; // blue
        
        card.style.borderTop = `3px solid ${bColor}`;
    }

    // Number counting animation
    function animateCountUp(element) {
        const target = parseFloat(element.getAttribute('data-target'));
        const duration = 1500;
        const stepTime = 20;
        const steps = Math.floor(duration / stepTime);
        const increment = target / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.innerText = target.toFixed(0);
                clearInterval(timer);
            } else {
                element.innerText = current.toFixed(0);
            }
        }, stepTime);
    }

    // Form Submission
    lqsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!validateCurrentStep()) return;

        // Collect answers
        const formData = new FormData(lqsForm);
        let domainTotals = [0, 0, 0, 0, 0];

        // Process 25 questions
        for (let d = 1; d <= 5; d++) {
            let rawSum = 0;
            for (let q = 1; q <= 5; q++) {
                const val = parseInt(formData.get(`q${d}_${q}`));
                rawSum += val;
            }
            // Domain Score Percentage = (Raw / 20) * 100 = Raw * 5
            const domainPct = rawSum * 5;
            domainTotals[d - 1] = domainPct;
            
            // Assign UI
            const cat = getCategoryForDomain(domainPct);
            applyCardUI(d, domainPct, cat);
        }

        // Calculate Overall
        const lqsSum = domainTotals.reduce((a, b) => a + b, 0);
        const lqsPct = Math.round(lqsSum / 5);
        const lqsCat = getCategoryForLQS(lqsPct);

        // Update Over-all UI
        const resOverall = document.getElementById('res-overall');
        resOverall.setAttribute('data-target', lqsPct);
        
        const bandTitle = document.getElementById('lqs-band-title');
        bandTitle.textContent = `${lqsCat.label} Score`;
        
        const actionDesc = document.getElementById('lqs-action-desc');
        actionDesc.textContent = lqsCat.action;

        // Apply circle color
        let circleColor = '#ef4444';
        if (lqsCat.class === 'needs-attention') circleColor = '#f59e0b';
        if (lqsCat.class === 'moderate') circleColor = '#eab308';
        if (lqsCat.class === 'good') circleColor = '#10b981';
        if (lqsCat.class === 'excellent') circleColor = '#3b82f6';
        
        document.querySelector('.lqs-score-circle').style.borderColor = circleColor;
        document.querySelector('.lqs-total-card').style.borderTop = `4px solid ${circleColor}`;

        // Switch Views
        lqsForm.classList.add('hidden');
        const resultsArea = document.getElementById('lqs-results');
        resultsArea.classList.remove('hidden');
        
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Trigger animations
        setTimeout(() => {
            document.querySelectorAll('.count-up').forEach(animateCountUp);
        }, 100);
    });

    // PDF Download Logic
    const downloadBtn = document.getElementById('lqs-download-pdf');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', async () => {
            try {
                // Initial prompt handling
                downloadBtn.innerHTML = '<i data-lucide="loader"></i> Generating...';
                downloadBtn.classList.add('loading');
                downloadBtn.disabled = true;
                
                // Allow UI to update
                await new Promise(r => setTimeout(r, 100));

                const reportElement = document.getElementById('capture-report-area');
                
                // Use html2canvas to capture the form
                const canvas = await html2canvas(reportElement, {
                    scale: 2, 
                    useCORS: true,
                    backgroundColor: '#0f172a',
                    logging: false
                });

                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                
                // Add header generic styling
                pdf.setFillColor(15, 23, 42); // slate-900 equivalent
                pdf.rect(0, 0, pdfWidth, 25, 'F');
                pdf.setTextColor(255, 255, 255);
                pdf.setFontSize(14);
                pdf.text('FitCalc | Life Quality Score Assessment', 10, 16);
                
                pdf.addImage(imgData, 'JPEG', 0, 30, pdfWidth, pdfHeight);
                pdf.save('LQS_Health_Report.pdf');

            } catch (error) {
                console.error("PDF generation failed:", error);
                alert("Failed to generate PDF. Please try again.");
            } finally {
                // Restore button
                downloadBtn.innerHTML = '<i data-lucide="file-text"></i> Download LQS Report';
                downloadBtn.classList.remove('loading');
                downloadBtn.disabled = false;
                lucide.createIcons(); // refresh icons
            }
        });
    }

    // Initialize lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

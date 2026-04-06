document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    if (window.lucide) lucide.createIcons();

    const masterForm = document.getElementById('master-calculator-form');
    const resultsDashboard = document.getElementById('master-results');
    const downloadBtn = document.getElementById('master-download-pdf');

    // Calculation Constants & Helpers
    const getVal = (id) => parseFloat(document.getElementById(id).value) || 0;
    const setRes = (id, val, text = '') => {
        const el = document.getElementById(id);
        if (el) el.innerText = text || val;
    };

    if (masterForm) {
        masterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            calculateAll();
        });
    }

    function calculateAll() {
        // Collect Inputs
        const gender = document.querySelector('input[name="gender"]:checked').value;
        const age = getVal('age');
        const weight = getVal('weight');
        const height = getVal('height'); // cm
        const neck = getVal('neck');
        const waist = getVal('waist');
        const hip = getVal('hip');
        const activityEl = document.querySelector('input[name="physical-activity"]:checked');
        const activity = activityEl ? parseFloat(activityEl.value) : 1.2;
        const stress = getVal('stress');
        const modification = parseFloat(document.getElementById('goal').value) || 0;
        const thigh = getVal('thigh');

        if (!weight || !height || !age) return;

        // 1. BMI
        const heightM = height / 100;
        const bmi = (weight / (heightM * heightM)).toFixed(1);
        setRes('res-bmi', bmi);
        
        let bmiStatus = "Healthy weight", bmiColor = "green", bmiDesc = "Your weight is in the healthy range for your height. The goal is to maintain this.";
        let bmiProgress = 50;
        if (bmi < 18.5) { bmiStatus = "Underweight"; bmiColor = "orange"; bmiProgress = 20; bmiDesc = "Your weight is below the healthy range. Consider a caloric surplus."; }
        else if (bmi >= 25 && bmi < 30) { bmiStatus = "Overweight"; bmiColor = "orange"; bmiProgress = 75; bmiDesc = "Your weight is slightly above the ideal range for your height."; }
        else if (bmi >= 30) { bmiStatus = "Obese"; bmiColor = "orange"; bmiProgress = 95; bmiDesc = "Your weight is significantly above the ideal range. Consult a professional."; }
        updateCard('bmi', bmiColor, bmiStatus, bmiProgress, bmiDesc);

        // 2. IBW (Devine Formula approximation)
        let ibw = 0;
        if (gender === 'male') {
            ibw = 50 + 2.3 * ((height / 2.54) - 60);
        } else {
            ibw = 45.5 + 2.3 * ((height / 2.54) - 60);
        }
        setRes('res-ibw', ibw.toFixed(1));
        
        const diff = weight - ibw;
        let ibwBadge = "At ideal weight", ibwColor = "green", ibwDesc = "You are currently at your mathematically ideal body weight. Excellent.";
        let ibwProgress = 50;
        if (diff > 2) { 
            ibwBadge = `${diff.toFixed(1)} kg above ideal`; ibwColor = "orange"; ibwProgress = Math.min(100, 50 + diff*2); 
            ibwDesc = `Your ideal weight is ${ibw.toFixed(1)} kg. Getting there will meaningfully improve your metabolic health.`;
        }
        else if (diff < -2) { 
            ibwBadge = `${Math.abs(diff).toFixed(1)} kg below ideal`; ibwColor = "orange"; ibwProgress = Math.max(0, 50 + diff*2); 
            ibwDesc = `Your ideal weight is ${ibw.toFixed(1)} kg. Consider increasing muscle mass.`;
        }
        updateCard('ibw', ibwColor, ibwBadge, ibwProgress, ibwDesc);

        // 3. WHR
        let whrRisk = 0; // 0 = low, 1 = med, 2 = high
        if (waist && hip) {
            const whr = (waist / hip).toFixed(2);
            setRes('res-whr', whr);
            const threshold = (gender === 'male' ? 0.9 : 0.85);
            let wColor = "green", wBadge = "Low risk", wDesc = "Good fat distribution. Less visceral fat means lower risk of heart and metabolic disease.";
            let wProg = 30;
            if (whr > threshold) {
                wColor = "orange"; wBadge = "High risk"; wProg = 85; whrRisk = 2;
                wDesc = "Higher ratio indicates more visceral fat. This is linked to elevated metabolic risk.";
            } else if (whr > threshold - 0.05) {
                wProg = 60; // Moderate
            }
            updateCard('whr', wColor, wBadge, wProg, wDesc);
        } else {
            setRes('res-whr', '--');
            updateCard('whr', 'green', 'Need Measurements', 0, 'Enter waist and hip measurements for waist-to-hip ratio.');
        }

        // 4. BMR (Mifflin-St Jeor)
        let bmr = 0;
        if (gender === 'male') {
            bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
        } else {
            bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
        }
        setRes('res-bmr', bmr.toFixed(0));

        // 5. Daily Calories (TDEE)
        const calories = (bmr * activity * stress).toFixed(0);
        setRes('res-tdee', calories);

        // 6. Body Fat % (US Navy Method)
        let bfp = null;
        let bfpRisk = 0;
        if (waist && neck) {
            if (gender === 'male') {
                bfp = 86.010 * Math.log10(waist - neck) - 70.041 * Math.log10(height) + 36.76;
            } else if (hip) {
                bfp = 163.205 * Math.log10(waist + hip - neck) - 97.684 * Math.log10(height) - 78.387;
            }
        }
        
        if (bfp && !isNaN(bfp)) {
            setRes('res-bfp', bfp.toFixed(1));
            let bColor = "green", bBadge = "Fitness", bDesc = "Healthy body fat percentage. Maintain current lifestyle.", bProg = 40;
            // Simplified brackets
            if (gender === 'male') {
                if (bfp < 6) { bColor = "orange"; bBadge = "Essential Fat Only"; bProg = 10; bDesc = "Extremely low body fat. Can cause health issues."; bfpRisk = 1; }
                else if (bfp < 14) { bColor = "green"; bBadge = "Athletic"; bProg = 25; bDesc = "Excellent — typical of very active individuals."; }
                else if (bfp < 25) { bColor = "green"; bBadge = "Average"; bProg = 50; }
                else { bColor = "orange"; bBadge = "Above Average"; bProg = 85; bDesc = "Higher body fat percentage. Consider calorie deficit."; bfpRisk = 2; }
            } else {
                if (bfp < 14) { bColor = "orange"; bBadge = "Essential Fat Only"; bProg = 10; bDesc = "Extremely low body fat. Can cause health issues."; bfpRisk = 1; }
                else if (bfp < 21) { bColor = "green"; bBadge = "Athletic"; bProg = 25; bDesc = "Excellent — typical of very active individuals."; }
                else if (bfp < 32) { bColor = "green"; bBadge = "Average"; bProg = 50; }
                else { bColor = "orange"; bBadge = "Above Average"; bProg = 85; bDesc = "Higher body fat percentage. Consider calorie deficit."; bfpRisk = 2;}
            }
            updateCard('bfp', bColor, bBadge, bProg, bDesc);
        } else {
            setRes('res-bfp', '--');
            updateCard('bfp', 'green', 'Need Measurements', 0, 'Enter neck and waist measurements to calculate body fat.');
        }

        // 7. Thigh Metric (TWR)
        let thighRisk = 0;
        if (thigh && waist) {
            const twr = (thigh / waist).toFixed(2);
            setRes('res-thigh', twr);
            let tColor = "green", tBadge = "Healthy TWR", tDesc = "A higher thigh-to-waist ratio suggests more leg muscle relative to visceral fat — a strong marker of metabolic health.";
            let tProg = 80;
            if (twr < 0.45) {
                tColor = "orange"; tBadge = "Higher Risk"; tProg = 30; thighRisk = 2;
                tDesc = "A lower ratio can indicate less muscle mass or higher abdominal fat. Aiming for leg strength training may help.";
            } else if (thigh < 55) {
                tBadge = "Sub-optimal Girth"; tProg = 50;
                tDesc = "Thigh circumference below 55cm can be associated with increased metabolic risk in some clinical studies.";
            }
            updateCard('thigh', tColor, tBadge, tProg, tDesc);
        } else {
            setRes('res-thigh', '--');
            updateCard('thigh', 'green', 'Need Measurements', 0, 'Enter thigh and waist measurements for metabolic risk profile.');
        }

        // Header Population
        const userName = document.getElementById('user-name') ? document.getElementById('user-name').value : "Client";
        setRes('report-name', userName ? `${userName}'s Body Composition Report` : 'Your Body Composition Report');
        setRes('report-date', `Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`);
        
        setRes('rep-age', `${age} yrs`);
        setRes('rep-gender', gender.charAt(0).toUpperCase() + gender.slice(1));
        setRes('rep-height', `${height} cm`);
        setRes('rep-weight', `${weight} kg`);
        
        const activityText = activityEl && activityEl.nextElementSibling ? activityEl.nextElementSibling.querySelector('.activity-title').innerText : "Standard";
        setRes('rep-activity', activityText);

        // Overall Assessment Logic
        let totalRisks = (bmi >= 25 ? 1 : 0) + (whrRisk === 2 ? 1 : 0) + (ibwColor === 'orange' ? 1 : 0) + (bfpRisk === 2 ? 1 : 0) + (thighRisk === 2 ? 1 : 0);
        let asTitle = "Optimal Composition", asDesc = "Your overall body composition is excellent. Keep up the great work maintaining this balance.";
        
        if (totalRisks === 1 || totalRisks === 2) {
            asTitle = "Mostly Healthy — Area to Watch";
            asDesc = "Your overall composition is good, but there are specific areas where a focused plan could optimise your metabolic health.";
        } else if (totalRisks > 2) {
            asTitle = "Action Recommended";
            asDesc = "Several indicators are outside the optimal range. A structured approach focusing on nutrition and activity is recommended.";
        } else if (bmi < 18.5) {
            asTitle = "Below Optimal Range";
            asDesc = "Your metrics indicate you are underweight. Focus on nutrient-dense calorie surplus and resistance training.";
        }
        
        setRes('assessment-title', asTitle);
        setRes('assessment-desc', asDesc);

        // Target Card
        const rdi = (parseFloat(calories) + modification).toFixed(0);
        setRes('res-target', rdi);
        
        let targetAdvice = "Maintain this intake consistently to hold your current weight.";
        if (modification < 0) targetAdvice = `Eating ${Math.abs(modification)} kcal below maintenance. Pair with protein to preserve lean mass.`;
        else if (modification > 0) targetAdvice = `Eating ${Math.abs(modification)} kcal above maintenance. Focus on strength training to build muscle.`;
        const adviceEl = document.getElementById('target-advice');
        if (adviceEl) adviceEl.innerText = targetAdvice;

        // BMI Needle Gauge
        updateBMINeedle(parseFloat(bmi));

        // Calorie Donut Chart
        drawCalorieDonut(parseFloat(bmr.toFixed(0)), parseFloat(calories), modification);

        // Show Results
        resultsDashboard.classList.remove('hidden');
        resultsDashboard.classList.add('fade-in'); 
        
        // Reinit lucide icons for the new DOM
        if (window.lucide) lucide.createIcons();
        
        // Count-up animations
        animateCountUps();
        
        resultsDashboard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // BMI Needle Gauge
    function updateBMINeedle(bmi) {
        const needle = document.getElementById('bmi-needle');
        if (!needle) return;
        // Map BMI 15-40 to angle -90° to +90° (left to right of semi-circle)
        const min = 15, max = 40;
        const clamped = Math.max(min, Math.min(max, bmi));
        const angle = -90 + ((clamped - min) / (max - min)) * 180;
        needle.style.transform = `rotate(${angle}deg)`;
    }

    // Donut Chart (pure Canvas)
    function drawCalorieDonut(bmr, tdee, modification) {
        const canvas = document.getElementById('calorie-donut');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const cx = 90, cy = 90, outerR = 80, innerR = 55;
        const target = tdee + modification;
        
        ctx.clearRect(0, 0, 180, 180);
        
        const activeCals = Math.max(0, tdee - bmr);
        const goalCals = Math.abs(modification);
        const total = bmr + activeCals + goalCals;
        
        // Slices: BMR (blue), Active (green), Goal (orange/red)
        const slices = [
            { value: bmr, color: '#0ea5e9' },
            { value: activeCals, color: '#10b981' },
            { value: goalCals, color: modification < 0 ? '#ef4444' : '#f59e0b' }
        ];
        
        let startAngle = -Math.PI / 2;
        slices.forEach(slice => {
            if (slice.value <= 0) return;
            const sliceAngle = (slice.value / total) * (2 * Math.PI);
            ctx.beginPath();
            ctx.arc(cx, cy, outerR, startAngle, startAngle + sliceAngle);
            ctx.arc(cx, cy, innerR, startAngle + sliceAngle, startAngle, true);
            ctx.closePath();
            ctx.fillStyle = slice.color;
            ctx.fill();
            startAngle += sliceAngle;
        });
        
        // Update center label
        const donutTotal = document.getElementById('donut-total');
        if (donutTotal) donutTotal.innerText = Math.round(target > 0 ? target : tdee);
        
        // Update legends
        setRes('legend-bmr', `${bmr} kcal`);
        setRes('legend-active', `${activeCals} kcal`);
        setRes('legend-goal', `${modification === 0 ? 'No adjustment' : (modification > 0 ? '+' : '') + modification + ' kcal'}`);
        
        const goalLabel = document.getElementById('legend-goal-label');
        const goalDot = document.getElementById('legend-goal-dot');
        if (goalLabel) goalLabel.innerText = modification < 0 ? 'Calorie Deficit' : modification > 0 ? 'Calorie Surplus' : 'Goal Adjustment';
        if (goalDot) goalDot.style.background = modification < 0 ? '#ef4444' : '#f59e0b';
    }

    // Count-up number animation
    function animateCountUps() {
        document.querySelectorAll('.count-up').forEach(el => {
            const text = el.innerText;
            const target = parseFloat(text);
            if (isNaN(target) || text === '--') return;
            
            const duration = 1200;
            const startTime = performance.now();
            const isDecimal = text.includes('.');
            
            el.innerText = '0';
            
            function step(now) {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                // Ease out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = target * eased;
                el.innerText = isDecimal ? current.toFixed(1) : Math.round(current);
                if (progress < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
        });
    }

    function updateCard(id, colorClass, badgeText, progressPercent, desc) {
        const cardEl = document.getElementById(`card-${id}`);
        const badgeEl = document.getElementById(`badge-${id}`);
        const progEl = document.getElementById(`prog-${id}`);
        const descEl = document.getElementById(`desc-${id}`);
        
        if(cardEl) {
            // retain base classes
            cardEl.className = `metric-card border-top-${colorClass}`;
            cardEl.querySelector('.metric-value').className = `metric-value text-${colorClass}`;
        }
        if(badgeEl) {
            badgeEl.innerText = badgeText;
            badgeEl.className = `metric-badge badge-${colorClass}`;
        }
        if(progEl) {
            progEl.style.width = `${progressPercent}%`;
            progEl.className = `metric-progress progress-${colorClass}`;
        }
        if(descEl) descEl.innerText = desc;
    }

    // PDF Generation — Premium Native Report
    if (downloadBtn) {
        downloadBtn.addEventListener('click', async () => {
            const originalText = downloadBtn.innerHTML;
            downloadBtn.innerHTML = '<i data-lucide="loader" class="spin"></i> Compiling Report...';
            downloadBtn.style.opacity = '0.7';
            downloadBtn.disabled = true;
            if (window.lucide) lucide.createIcons();

            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF('p', 'mm', 'a4');
                const pW = doc.internal.pageSize.getWidth(); // 210
                const pH = doc.internal.pageSize.getHeight(); // 297
                const m = 12; // margin

                // Load the logo image
                let logoData = null;
                try {
                    const logoImg = new Image();
                    logoImg.crossOrigin = 'anonymous';
                    await new Promise((resolve, reject) => {
                        logoImg.onload = resolve;
                        logoImg.onerror = reject;
                        logoImg.src = 'assets/Prakriti - logo.png';
                    });
                    const logoCanvas = document.createElement('canvas');
                    logoCanvas.width = logoImg.naturalWidth;
                    logoCanvas.height = logoImg.naturalHeight;
                    const lctx = logoCanvas.getContext('2d');
                    lctx.drawImage(logoImg, 0, 0);
                    logoData = logoCanvas.toDataURL('image/png');
                } catch(e) { console.warn('Logo load failed, proceeding without logo.'); }

                // Collect all data
                const userName = document.getElementById('user-name') ? document.getElementById('user-name').value : "Client";
                const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
                const gender = document.querySelector('input[name="gender"]:checked')?.value || 'male';
                const age = getVal('age');
                const weight = getVal('weight');
                const height = getVal('height');
                const activityEl = document.querySelector('input[name="physical-activity"]:checked');
                const activityText = activityEl?.nextElementSibling?.querySelector('.activity-title')?.innerText || "Standard";

                const bmi = document.getElementById('res-bmi')?.innerText || '--';
                const bmr = document.getElementById('res-bmr')?.innerText || '--';
                const tdee = document.getElementById('res-tdee')?.innerText || '--';
                const ibw = document.getElementById('res-ibw')?.innerText || '--';
                const whr = document.getElementById('res-whr')?.innerText || '--';
                const bfp = document.getElementById('res-bfp')?.innerText || '--';
                const thighVal = document.getElementById('res-thigh')?.innerText || '--';
                const target = document.getElementById('res-target')?.innerText || '--';

                const bmiBadge = document.getElementById('badge-bmi')?.innerText || '--';
                const ibwBadge = document.getElementById('badge-ibw')?.innerText || '--';
                const whrBadge = document.getElementById('badge-whr')?.innerText || '--';
                const bfpBadge = document.getElementById('badge-bfp')?.innerText || '--';
                const thighBadge = document.getElementById('badge-thigh')?.innerText || '--';

                const bmiDesc = document.getElementById('desc-bmi')?.innerText || '';
                const ibwDesc = document.getElementById('desc-ibw')?.innerText || '';
                const whrDesc = document.getElementById('desc-whr')?.innerText || '';
                const bfpDesc = document.getElementById('desc-bfp')?.innerText || '';
                const thighDesc = document.getElementById('desc-thigh')?.innerText || '';
                const bmrDesc = document.getElementById('desc-bmr')?.innerText || '';
                const tdeeDesc = document.getElementById('desc-tdee')?.innerText || '';
                
                const assessTitle = document.getElementById('assessment-title')?.innerText || '';
                const assessDesc = document.getElementById('assessment-desc')?.innerText || '';
                const targetAdvice = document.getElementById('target-advice')?.innerText || '';

                // Helper: draw rounded rect
                function roundRect(x, y, w, h, r, fillColor, strokeColor) {
                    if (fillColor) { doc.setFillColor(...fillColor); }
                    if (strokeColor) { doc.setDrawColor(...strokeColor); doc.roundedRect(x, y, w, h, r, r, fillColor && strokeColor ? 'FD' : fillColor ? 'F' : 'S'); }
                    else { doc.roundedRect(x, y, w, h, r, r, 'F'); }
                }

                // ===== PAGE 1 =====
                let y = 0;

                // --- Green Header Band ---
                roundRect(0, 0, pW, 56, 0, [33, 111, 77], null);
                doc.setTextColor(255, 255, 255);

                // Logo
                if (logoData) {
                    try {
                        doc.addImage(logoData, 'PNG', pW - m - 50, 4, 50, 18);
                    } catch(e) { /* logo embed failed, continue */ }
                }
                
                // Badge
                roundRect(m, 8, 58, 7, 3, [255, 255, 255, 50], null);
                doc.setFillColor(255, 255, 255, 40);
                doc.roundedRect(m, 8, 58, 7, 3, 3, 'F');
                doc.setFontSize(6.5);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(255, 255, 255);
                doc.text("BODY COMPOSITION REPORT", m + 3, 13);

                // Title
                doc.setFontSize(20);
                doc.setFont("times", "bold");
                doc.text(`${userName}'s Health Report`, m, 27);

                // Subtitle
                doc.setFontSize(9);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(220, 240, 230);
                doc.text(`Generated ${date} · MyPrakrit Clinical Engine`, m, 34);

                // Demographic Pills
                const pills = [
                    { label: 'Age', value: `${age} yrs` },
                    { label: 'Gender', value: gender.charAt(0).toUpperCase() + gender.slice(1) },
                    { label: 'Height', value: `${height} cm` },
                    { label: 'Weight', value: `${weight} kg` },
                    { label: 'Activity', value: activityText }
                ];
                let px = m;
                pills.forEach(pill => {
                    const pw = doc.getTextWidth(pill.value) + 14;
                    doc.setFillColor(255, 255, 255, 30);
                    doc.roundedRect(px, 38, pw, 10, 2, 2, 'F');
                    doc.setFontSize(6);
                    doc.setTextColor(200, 230, 215);
                    doc.text(pill.label, px + 3, 42);
                    doc.setFontSize(9);
                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(255, 255, 255);
                    doc.text(pill.value, px + 3, 46.5);
                    doc.setFont("helvetica", "normal");
                    px += pw + 4;
                });

                y = 58;

                // --- Overall Assessment ---
                roundRect(m, y, pW - 2*m, 22, 4, [240, 253, 244], [209, 250, 229]);
                doc.setFontSize(7);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(6, 95, 70);
                doc.text("OVERALL ASSESSMENT", m + 5, y + 6);
                doc.setFontSize(13);
                doc.setFont("times", "bold");
                doc.text(assessTitle, m + 5, y + 13);
                doc.setFontSize(8);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(6, 78, 59);
                doc.text(assessDesc, m + 5, y + 18, { maxWidth: pW - 2*m - 10 });

                y += 28;

                // --- Metric Cards (2 cols x 3 rows) ---
                const cardW = (pW - 2*m - 6) / 2;
                const cardH = 42;
                const metrics = [
                    { title: 'BMI', sub: 'Body Mass Index', value: bmi, unit: 'kg/m²', badge: bmiBadge, desc: bmiDesc, color: parseFloat(bmi) >= 18.5 && parseFloat(bmi) < 25 ? 'green' : 'orange' },
                    { title: 'BMR', sub: 'Basal Metabolic Rate', value: bmr, unit: 'kcal/day', badge: 'Your daily base burn', desc: bmrDesc, color: 'blue' },
                    { title: 'TDEE', sub: 'Total Daily Energy Expenditure', value: tdee, unit: 'kcal/day', badge: 'Your total calorie need', desc: tdeeDesc, color: 'blue' },
                    { title: 'IDEAL WEIGHT', sub: 'Ideal Body Weight', value: ibw, unit: 'kg', badge: ibwBadge, desc: ibwDesc, color: 'orange' },
                    { title: 'WHR', sub: 'Waist to Hip Ratio', value: whr, unit: 'ratio', badge: whrBadge, desc: whrDesc, color: whr !== '--' && parseFloat(whr) <= (gender === 'male' ? 0.9 : 0.85) ? 'green' : 'orange' },
                    { title: 'BODY FAT', sub: 'Body Fat Percentage', value: bfp, unit: '%', badge: bfpBadge, desc: bfpDesc, color: bfp !== '--' && parseFloat(bfp) < (gender === 'male' ? 25 : 32) ? 'green' : 'orange' },
                    { title: 'THIGH PROFILE', sub: 'Thigh-to-Waist Ratio', value: thighVal, unit: 'ratio', badge: thighBadge, desc: thighDesc, color: thighVal !== '--' && parseFloat(thighVal) >= 0.45 ? 'green' : 'orange' }
                ];

                const colorMap = {
                    green: { top: [16, 185, 129], badge: [209, 250, 229], badgeText: [6, 95, 70], value: [6, 95, 70] },
                    blue: { top: [14, 165, 233], badge: [224, 242, 254], badgeText: [7, 89, 133], value: [7, 89, 133] },
                    orange: { top: [245, 158, 11], badge: [254, 243, 199], badgeText: [146, 64, 14], value: [146, 64, 14] }
                };

                metrics.forEach((met, i) => {
                    const col = i % 2;
                    const row = Math.floor(i / 2);
                    const cx = m + col * (cardW + 6);
                    const cy = y + row * (cardH + 5);
                    const cm = colorMap[met.color] || colorMap.green;

                    // Check for page break
                    if (cy + cardH > pH - 30) {
                        doc.addPage();
                        y = m;
                    }

                    // Card bg
                    roundRect(cx, cy, cardW, cardH, 4, [255, 255, 255], [226, 232, 240]);
                    // Top color bar
                    doc.setFillColor(...cm.top);
                    doc.rect(cx, cy, cardW, 2, 'F');

                    // Title
                    doc.setFontSize(7);
                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(100, 116, 139);
                    doc.text(met.title, cx + 4, cy + 8);
                    doc.setFontSize(6);
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(148, 163, 184);
                    doc.text(met.sub, cx + 4, cy + 12);

                    // Value
                    doc.setFontSize(22);
                    doc.setFont("times", "bold");
                    doc.setTextColor(...cm.value);
                    doc.text(met.value, cx + 4, cy + 24);
                    // Unit
                    const valWidth = doc.getTextWidth(met.value);
                    doc.setFontSize(8);
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(100, 116, 139);
                    doc.text(met.unit, cx + 6 + valWidth, cy + 24);

                    // Badge
                    const badgeTrunc = met.badge.substring(0, 25);
                    const bw = doc.getTextWidth(badgeTrunc) + 6;
                    roundRect(cx + 4, cy + 27, bw + 2, 5.5, 2.5, cm.badge, null);
                    doc.setFontSize(6.5);
                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(...cm.badgeText);
                    doc.text(badgeTrunc, cx + 7, cy + 31);

                    // Desc
                    doc.setFontSize(6);
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(100, 116, 139);
                    const descTrunc = met.desc.substring(0, 90) + (met.desc.length > 90 ? '...' : '');
                    doc.text(descTrunc, cx + 4, cy + 37, { maxWidth: cardW - 8 });
                });

                y += 3 * (cardH + 5) + 5;

                // --- Target Calorie Card ---
                if (y + 22 > pH - 30) { doc.addPage(); y = m; }
                roundRect(m, y, pW - 2*m, 22, 4, [15, 23, 42], null);
                doc.setFontSize(6.5);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(180, 200, 220);
                doc.text("YOUR DAILY TARGET", m + 6, y + 7);
                doc.setFontSize(22);
                doc.setFont("times", "bold");
                doc.setTextColor(255, 255, 255);
                doc.text(`${target}`, m + 6, y + 17);
                const tw = doc.getTextWidth(target);
                doc.setFontSize(9);
                doc.setFont("helvetica", "normal");
                doc.text("kcal/day", m + 8 + tw, y + 17);

                // Advice text
                doc.setFontSize(7.5);
                doc.setTextColor(180, 200, 220);
                doc.text(targetAdvice, pW - m - 4, y + 13, { maxWidth: 70, align: 'right' });

                y += 28;

                // --- Calorie Breakdown Legend ---
                if (y + 20 > pH - 30) { doc.addPage(); y = m; }
                roundRect(m, y, pW - 2*m, 24, 4, [248, 250, 252], [226, 232, 240]);
                doc.setFontSize(9);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(15, 23, 42);
                doc.text("Calorie Breakdown", m + 5, y + 7);

                const bmrVal = parseInt(bmr) || 0;
                const tdeeVal = parseInt(tdee) || 0;
                const activeCals = Math.max(0, tdeeVal - bmrVal);
                const modification = parseFloat(document.getElementById('goal').value) || 0;

                const breakItems = [
                    { label: 'Basal Metabolism (BMR)', val: `${bmrVal} kcal`, color: [14, 165, 233] },
                    { label: 'Activity Calories', val: `${activeCals} kcal`, color: [16, 185, 129] },
                    { label: modification < 0 ? 'Calorie Deficit' : 'Goal Adjustment', val: modification === 0 ? 'None' : `${modification > 0 ? '+' : ''}${modification} kcal`, color: modification < 0 ? [239, 68, 68] : [245, 158, 11] }
                ];

                let bx = m + 5;
                breakItems.forEach(item => {
                    doc.setFillColor(...item.color);
                    doc.roundedRect(bx, y + 11, 4, 4, 1, 1, 'F');
                    doc.setFontSize(7);
                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(15, 23, 42);
                    doc.text(item.label, bx + 6, y + 14.5);
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(100, 116, 139);
                    doc.text(item.val, bx + 6, y + 19);
                    bx += 62;
                });

                // --- Footer ---
                const footY = pH - 14;
                doc.setDrawColor(226, 232, 240);
                doc.line(m, footY - 4, pW - m, footY - 4);

                // Footer logo
                if (logoData) {
                    try { doc.addImage(logoData, 'PNG', m, footY - 2, 25, 9); } catch(e) {}
                }

                doc.setFontSize(7);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(148, 163, 184);
                doc.text("Generated by MyPrakrit Health Intelligence Engine · myprakrit.in", m + 28, footY + 2);
                doc.text(`Report Date: ${date}`, pW - m, footY + 2, { align: 'right' });

                doc.setFontSize(5.5);
                doc.setTextColor(180, 180, 180);
                doc.text("This report is for informational purposes only and does not constitute medical advice. Consult a qualified healthcare provider.", m, footY + 8);

                // Save
                doc.save(`MyPrakrit_Health_Report_${userName.replace(/\s/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
            } catch (err) {
                console.error("PDF Gen Failed:", err);
                alert("Report compilation encountered an issue. Please try again.");
                document.body.classList.remove('pdf-capture-mode');
            } finally {
                downloadBtn.innerHTML = '<i data-lucide="file-text"></i> Download Advanced Health Report';
                downloadBtn.style.opacity = '1';
                downloadBtn.disabled = false;
                if (window.lucide) lucide.createIcons();
            }
        });
    }
});


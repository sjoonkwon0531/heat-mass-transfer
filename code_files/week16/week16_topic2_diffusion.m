% Week 16 · Topic 2 — Final review: steady and unsteady molecular diffusion
% Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
%   Stefan tube: N_A = (cD/L) ln[(1 - yA2)/(1 - yA1)];  Deal-Grove: x^2 + A x = B t
%   Hatta: Ha = delta sqrt(k1/D), E = Ha/tanh(Ha);  semi-infinite: erfc(z/(2 sqrt(D t)))
%   slab uptake: M/Minf = 1 - sum 8/((2k-1)^2 pi^2) exp(-(2k-1)^2 pi^2 Fo)
%   sphere release: m/m0 = (6/pi^2) sum (1/n^2) exp(-n^2 pi^2 tau)
function week16_topic2_diffusion()
    KB_EV = 8.617e-5;
    fprintf('Topic 2 — steady and unsteady molecular diffusion\n\n');
    c = 101325/(8.314*298.15); y1 = 7830/101325; D = 1.25e-5; L = 0.08;
    N = c*D/L*log(1/(1 - y1)); Nf = c*D*y1/L;
    fprintf('[1] Stefan tube (ethanol, 25 C, 1 atm, L = 8 cm, D = 0.125 cm2/s)\n');
    fprintf('   c = %.2f mol/m3, yA1 = %.4f, N_A = %.4e mol/m2 s, Fick = %.4e (ratio %.4f)\n', c, y1, N, Nf, N/Nf);
    fprintf('   daily loss = %.3f kg/m2\n\n', N*0.04607*86400);
    fprintf('[2] Deal-Grove, dry O2 on (111) Si, target x = 0.1 um\n');
    for Tc = [1100 1000]
        Tk = Tc + 273.15; B = 772*exp(-1.23/(KB_EV*Tk)); BA = 6.23e6*exp(-2.0/(KB_EV*Tk)); A = B/BA;
        fprintf('   %4.0f C: B = %.4f um2/h, B/A = %.4f um/h, A = %.4f um, t = %.3f h\n', Tc, B, BA, A, (0.01 + A*0.1)/B);
    end
    fprintf('\n');
    k1 = 8.5e3*0.2; Dc = 1.9e-9; d = 40e-6; Ha = d*sqrt(k1/Dc);
    fprintf('[3] Reactive absorption of CO2 in 0.2 M NaOH: k1 = %.0f 1/s\n', k1);
    fprintf('   Ha = %.2f, E = %.2f, k_c(phys) = %.3e m/s, k_c(react) = %.3e m/s\n\n', Ha, Ha/tanh(Ha), Dc/d, sqrt(Dc*k1));
    target = 1e17/2.5e20;
    phi = bisect(@(p) erfc(p) - target, 0, 6);
    fprintf('[4] Junction depth: erfc(phi) = %.1e -> phi = %.4f, z = %.3f um\n\n', target, phi, 2*phi*sqrt(6.5e-13*1800)*1e4);
    fprintf('[5] Slab uptake (both faces, L = 50 um, D = 1e-12 m2/s)\n');
    for f = [0.5 0.9]
        Fo = bisect(@(x) slab_uptake(x) - f, 1e-6, 2);
        fprintf('   M/Minf = %.1f: Fo = %.4f, t = %.1f s\n', f, Fo, Fo*(50e-6)^2/1e-12);
    end
    fprintf('   short-time form 4 sqrt(Fo/pi) = 0.5 -> Fo = %.4f\n\n', pi/64);
    fprintf('[6] Sphere release (R = 0.5 mm, D = 1e-11 m2/s)\n');
    for left = [0.5 0.1]
        tau = bisect(@(x) sphere_left(x) - left, 1e-6, 2);
        fprintf('   m/m0 = %.1f: tau = %.4f, t = %.1f min\n', left, tau, tau*(0.5e-3)^2/1e-11/60);
    end
    fprintf('   one-term (6/pi^2) exp(-pi^2 tau) = 0.1 -> tau = %.4f\n', log(6/pi^2/0.1)/pi^2);
end

function x = bisect(f, lo, hi)
    flo = f(lo);
    for i = 1:200
        m = 0.5*(lo + hi); fm = f(m);
        if (fm > 0) == (flo > 0), lo = m; flo = fm; else, hi = m; end
    end
    x = 0.5*(lo + hi);
end

function u = slab_uptake(Fo)
    k = 1:399; a = (2*k - 1).^2*pi^2;
    u = 1 - sum(8./a.*exp(-a*Fo));
end

function r = sphere_left(tau)
    n = 1:399;
    r = 6/pi^2*sum(exp(-n.^2*pi^2*tau)./n.^2);
end

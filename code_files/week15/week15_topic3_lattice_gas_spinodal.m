% Week 15 · Topic 3 — Lattice-gas (regular-solution) free energy, spinodal, binodal and the
%                      fastest-growing wavelength of spinodal decomposition
% Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
%   f(phi) = dF/(kB T N) = chi phi (1 - phi) + phi ln phi + (1 - phi) ln(1 - phi),  chi = kappa/(kB T)
%   spinodal: f'' = 0  ->  2 chi phi (1 - phi) = 1;   critical point chi_c = 2, phi_c = 1/2 (T_c = kappa/(2 kB))
%   binodal (symmetric): f'(phi) = 0  ->  chi (1 - 2 phi) + ln[phi/(1 - phi)] = 0
%   Cahn-Hilliard, linearised:  growth rate omega(q) = -M q^2 [ f''(phi0) + 2 K q^2 ],  K = C h^2, C = chi/2
%   q_c^2 = -f''/(2K) (marginal),  q_m^2 = -f''/(4K) = q_c^2/2 (fastest),  lambda_m = 2 pi / q_m
function week15_topic3_lattice_gas_spinodal()
    f  = @(p, chi) chi.*p.*(1 - p) + p.*log(p) + (1 - p).*log(1 - p);
    f2 = @(p, chi) -2*chi + 1./(p.*(1 - p));
    fprintf('Topic 3 — lattice-gas free energy, spinodal, binodal and lambda_m\n\n');
    fprintf('[1] Free energy of mixing f(phi) at phi = 0.1, 0.3, 0.5\n');
    for chi = [1.0 1.5 2.0 2.5 3.0]
        fprintf('   chi = %.1f:  f = %8.4f %8.4f %8.4f   f''''(0.5) = %6.3f\n', chi, f(0.1, chi), f(0.3, chi), f(0.5, chi), f2(0.5, chi));
    end
    fprintf('   critical point: chi_c = 2 (T_c = kappa/(2 kB)), phi_c = 0.5\n\n');
    fprintf('[2] Phase diagram:  T/T_c = 2/chi\n');
    fprintf('    chi    T/Tc    binodal (phi1, phi2)    spinodal (phi1, phi2)\n');
    for chi = [2.05 2.2 2.5 3.0 3.5 4.0]
        s = sqrt(1 - 2/chi); s1 = 0.5*(1 - s); s2 = 0.5*(1 + s);
        g = @(p) chi*(1 - 2*p) + log(p/(1 - p));
        lo = 1e-12; hi = s1;
        for i = 1:200
            m = 0.5*(lo + hi);
            if g(lo)*g(m) <= 0, hi = m; else, lo = m; end
        end
        b1 = 0.5*(lo + hi);
        fprintf('   %4.2f   %.4f   (%.4f, %.4f)        (%.4f, %.4f)\n', chi, 2/chi, b1, 1 - b1, s1, s2);
    end
    fprintf('\n');
    fprintf('[3] Linear Cahn-Hilliard: K = C h^2 with C = chi/2, h = 1 (lattice spacing)\n');
    fprintf('    chi   phi0   f''''(phi0)   q_c      q_m      lambda_m/h   lecture q_C = (1/h)[1 - 1/(2 chi phi0(1-phi0))]^(1/2)\n');
    cs = [2.5 0.5; 2.5 0.4; 3.0 0.5; 3.0 0.3; 4.0 0.5];
    for i = 1:5
        chi = cs(i,1); phi0 = cs(i,2); fpp = f2(phi0, chi); K = chi/2;
        qc = sqrt(-fpp/(2*K)); qm = sqrt(-fpp/(4*K)); lec = sqrt(1 - 1/(2*chi*phi0*(1 - phi0)));
        fprintf('   %4.1f   %.2f   %8.4f   %.4f   %.4f   %8.3f      %.4f\n', chi, phi0, fpp, qc, qm, 2*pi/qm, lec);
    end
    fprintf('   (the lecture''s q_C equals q_m = q_c/sqrt(2), the fastest-growing mode)\n\n');
    fprintf('[4] Growth-rate spectrum omega(q)/M for chi = 2.5, phi0 = 0.5 (f'''' = -1, K = 1.25)\n');
    for q = [0.1 0.2 0.3 0.4 0.4472 0.5 0.6 0.6325 0.7]
        w = -q^2*(f2(0.5, 2.5) + 2*1.25*q^2);
        fprintf('   q = %.4f   omega/M = %+.5f\n', q, w);
    end
end

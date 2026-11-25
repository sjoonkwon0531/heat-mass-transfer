% Week 15 · Topic 1 — Linear stability and the Turing instability
% Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
%   2x2 system: lambda^2 - T lambda + Delta = 0
%   reaction-diffusion: W_t = D lap W + J W  ->  lambda(k) = eig(J - k^2 D)
%   Example: Lengyel-Epstein (CDIMA) model
%     u_t = a - u - 4uv/(1+u^2) + lap u
%     v_t = sigma [ b (u - uv/(1+u^2)) + d lap v ]
function week15_topic1_turing_stability()
    fprintf('Topic 1 — linear stability and the Turing instability\n\n');
    fprintf('[1] Classification of 2x2 linear systems (trace T, determinant Delta)\n');
    cases = [-1 0 0 -2; 1 0 0 2; 1 0 0 -1; -0.5 -2 2 -0.5; 0.5 -2 2 0.5; 0 -1 1 0];
    for i = 1:size(cases, 1)
        c = cases(i, :);
        T = c(1) + c(4); De = c(1)*c(4) - c(2)*c(3);
        e = eig2(c(1), c(2), c(3), c(4));
        fprintf('   A = [[%5.2f %5.2f] [%5.2f %5.2f]]  T = %5.2f  Delta = %5.2f  lambda = %.3f%+.3fi, %.3f%+.3fi  -> %s\n', ...
            c(1), c(2), c(3), c(4), T, De, e(1), e(2), e(3), e(4), classify(c(1), c(2), c(3), c(4)));
    end
    fprintf('\n');
    a = 12; b = 0.3; sigma = 50; dd = 1;
    u = a/5; v = 1 + u^2; q = 1 + u^2;
    fu = (3*u^2 - 5)/q; fv = -4*u/q; gu = sigma*2*b*u^2/q; gv = -sigma*b*u/q;
    d = sigma*dd;
    fprintf('[2] Lengyel-Epstein model: a = %.0f, b = %.1f, sigma = %.0f, d = %.1f\n', a, b, sigma, dd);
    fprintf('   steady state u* = %.4f, v* = %.4f\n', u, v);
    fprintf('   J = [[%.4f %.4f] [%.4f %.4f]]\n', fu, fv, gu, gv);
    T = fu + gv; De = fu*gv - fv*gu;
    fprintf('   without diffusion: T = %.4f (< 0), Delta = %.4f (> 0) -> %s\n', T, De, classify(fu, fv, gu, gv));
    c1 = d*fu + gv; c2 = c1^2/(4*d);
    fprintf('   condition 1: d_eff*R11 + R22 = %.4f (> 0 needed)\n', c1);
    fprintf('   condition 2: Delta = %.4f < (d_eff*R11 + R22)^2/(4 d_eff) = %.4f\n', De, c2);
    kc2 = c1/(2*d);
    fprintf('   k* (minimum of det) = %.4f, L_c = 2 pi/k* = %.4f\n', sqrt(kc2), 2*pi/sqrt(kc2));
    ks = 3*(0:30000)/30000;
    lam = arrayfun(@(k) lam_max(fu, fv, gu, gv, d, k), ks);
    [best_l, ib] = max(lam); best_k = ks(ib);
    fprintf('   fastest-growing mode (max Re lambda): k_m = %.4f, lambda_m = %.4f, wavelength 2 pi/k_m = %.4f\n', best_k, best_l, 2*pi/best_k);
    band = ks(lam > 0);
    fprintf('   unstable band: %.4f < k < %.4f\n', band(1), band(end));
    fprintf('   (min-det k* equals the fastest mode only at onset; here they differ by %.1f%%)\n', 100*(sqrt(kc2)/best_k - 1));
    fprintf('\n');
    fprintf('[3] Critical diffusivity ratio: smallest d_eff giving a Turing band\n');
    lo_d = 1; hi_d = 200;
    for it = 1:80
        m = 0.5*(lo_d + hi_d); c1m = m*fu + gv;
        if c1m > 0 && De < c1m^2/(4*m), hi_d = m; else, lo_d = m; end
    end
    fprintf('   d_c = %.4f (sigma*d must exceed this)\n', hi_d);
end

function e = eig2(a11, a12, a21, a22)
    T = a11 + a22; De = a11*a22 - a12*a21; disc = T^2 - 4*De;
    if disc >= 0
        r = sqrt(disc); e = [(T + r)/2, 0, (T - r)/2, 0];
    else
        r = sqrt(-disc); e = [T/2, r/2, T/2, -r/2];
    end
end

function s = classify(a11, a12, a21, a22)
    T = a11 + a22; De = a11*a22 - a12*a21;
    if De < 0, s = 'saddle'; return; end
    if T^2 - 4*De < 0
        if T < 0, s = 'stable spiral'; elseif T > 0, s = 'unstable spiral'; else, s = 'center'; end
        return;
    end
    if T < 0, s = 'stable node'; else, s = 'unstable node'; end
end

function l = lam_max(fu, fv, gu, gv, d, k)
    e = eig2(fu - k^2, fv, gu, gv - d*k^2); l = e(1);
end

% Week 15 · Topic 4 — Spinodal decomposition (Cahn-Hilliard, conserved) vs. domain coarsening
%                      (Allen-Cahn, non-conserved): explicit finite differences
% Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
%   f(c) = 1/4 - c^2/2 + c^4/4 (double well, c = +/-1 are the two phases),  mu = c^3 - c - gamma lap c
%   Cahn-Hilliard:  c_t = lap mu         (mean of c conserved)
%   Allen-Cahn:     c_t = -mu            (mean of c not conserved)
%   linear CH about c0: omega(q) = q^2 (1 - 3 c0^2) - gamma q^4  ->  q_m^2 = (1 - 3 c0^2)/(2 gamma)
%   grid spacing h = 1, periodic boundaries, 5-point Laplacian
function week15_topic4_cahn_hilliard_allen_cahn()
    N = 64; GAMMA = 1.0; DT = 0.01; REPORT = [10 50 100 200];
    fprintf('Topic 4 — Cahn-Hilliard vs. Allen-Cahn: N = %d, gamma = %.1f, dt = %.2f\n\n', N, GAMMA, DT);
    fprintf('[1] Linear stability of the uniform state c0 (Cahn-Hilliard)\n');
    for c0 = [0.0 -0.3 -0.5 -0.6]
        a = 1 - 3*c0^2;
        if a <= 0
            fprintf('   c0 = %+.1f: 1 - 3 c0^2 = %.2f <= 0 -> outside the spinodal, no linear growth\n', c0, a);
        else
            qm = sqrt(a/(2*GAMMA));
            fprintf('   c0 = %+.1f: q_c = %.4f, q_m = %.4f, lambda_m = %.3f, omega_max = %.4f\n', c0, sqrt(a/GAMMA), qm, 2*pi/qm, a^2/(4*GAMMA));
        end
    end
    fprintf('\n');
    kinds = {'CH', 'CH', 'AC'}; c0s = [0.0 -0.3 0.0];
    for p = 1:3
        if strcmp(kinds{p}, 'CH'), nm = 'Cahn-Hilliard'; else, nm = 'Allen-Cahn'; end
        fprintf('[%s, c0 = %+.1f]\n', nm, c0s(p));
        fprintf('     t      mean c     chord length    area fraction c > 0\n');
        c = c0s(p) + 0.1*(lcg_field(N, 2024) - 0.5);
        step = 0;
        for T = REPORT
            target = round(T/DT);
            while step < target
                mu = ((c.*c).*c - c) - GAMMA*lap(c);
                if strcmp(kinds{p}, 'CH'), c = c + DT*lap(mu); else, c = c - DT*mu; end
                step = step + 1;
            end
            L = chord_length(c, N);
            if isfinite(L), Ls = sprintf('%8.3f', L); else, Ls = '  (none)'; end
            fprintf('   %5.0f   %+.6f   %s        %.4f\n', step*DT, mean(c(:)), Ls, mean(c(:) > 0));
        end
        for i = 0:15
            row = repmat('.', 1, 32);
            for j = 0:31
                if c(floor(i*N/16) + 1, floor(j*N/32) + 1) > 0, row(j + 1) = '#'; end
            end
            fprintf('   |%s|\n', row);
        end
        fprintf('\n');
    end
end

function r = lcg_field(N, seed)
    r = zeros(N*N, 1); s = seed;
    for i = 1:N*N
        s = mod(1664525*s + 1013904223, 4294967296);
        r(i) = s/4294967296;
    end
    r = reshape(r, N, N)';
end

function L = lap(Z)
    L = ((circshift(Z, 1, 1) + circshift(Z, -1, 1)) + (circshift(Z, 1, 2) + circshift(Z, -1, 2))) - 4*Z;
end

function L = chord_length(c, N)
    s = c > 0;
    n = sum(sum(s ~= circshift(s, 1, 1))) + sum(sum(s ~= circshift(s, 1, 2)));
    if n > 0, L = 2*N*N/n; else, L = Inf; end
end

% Week 15 · Topic 2 — Gray-Scott reaction-diffusion patterns (explicit finite differences)
% Heat & Mass Transfer (SKKU, Prof. S. Joon Kwon)
%   U + 2V -> 3V,  V -> P,  U fed at rate F, both drained:
%   U_t = Du lap U - U V^2 + F (1 - U)
%   V_t = Dv lap V + U V^2 - (F + k) V
%   grid spacing 1, time step 1, periodic boundaries, 5-point Laplacian
function week15_topic2_gray_scott()
    N = 96; DU = 0.16; DV = 0.08; DT = 1.0; STEPS = 6000;
    fprintf('Topic 2 — Gray-Scott patterns: N = %d, Du = %.2f, Dv = %.2f, dt = %.1f, %d steps\n\n', N, DU, DV, DT, STEPS);
    fprintf('[1] Homogeneous states: (U, V) = (1, 0) always; nontrivial states need\n');
    fprintf('    F/(F+k)^2 >= 4 i.e. V = [1 +/- sqrt(1 - 4(F+k)^2/F)] F/(2(F+k))\n');
    hs = [0.035 0.060; 0.040 0.060; 0.060 0.062];
    for i = 1:3
        F = hs(i,1); k = hs(i,2); disc = 1 - 4*(F + k)^2/F;
        if disc >= 0
            fprintf('    F = %.3f, k = %.3f: V = %.4f, %.4f\n', F, k, (1 + sqrt(disc))*F/(2*(F + k)), (1 - sqrt(disc))*F/(2*(F + k)));
        else
            fprintf('    F = %.3f, k = %.3f: only the trivial state\n', F, k);
        end
    end
    fprintf('\n');
    names = {'spots', 'stripes/labyrinth', 'mixed'};
    pr = [0.035 0.065; 0.060 0.062; 0.025 0.060];
    for p = 1:3
        [U, V] = run(pr(p,1), pr(p,2), N, DU, DV, DT, STEPS);
        fprintf('[%s] F = %.3f, k = %.3f\n', names{p}, pr(p,1), pr(p,2));
        fprintf('   mean U = %.5f, mean V = %.5f, area fraction V > 0.2 = %.4f\n', mean(U(:)), mean(V(:)), mean(V(:) > 0.2));
        ascii_map(V, N);
        fprintf('\n');
    end
end

function r = lcg_field(N, seed)
    r = zeros(N*N, 1); s = seed;
    for i = 1:N*N
        s = mod(1664525*s + 1013904223, 4294967296);
        r(i) = s/4294967296;
    end
    r = reshape(r, N, N)';   % row-major order, as in Python/C++
end

function L = lap(Z)
    L = ((circshift(Z, 1, 1) + circshift(Z, -1, 1)) + (circshift(Z, 1, 2) + circshift(Z, -1, 2))) - 4*Z;
end

function [U, V] = run(F, k, N, DU, DV, DT, STEPS)
    U = ones(N); V = zeros(N);
    r = lcg_field(N, 12345);
    c = (N/2 - 8 + 1):(N/2 + 8);
    U(c, c) = 0.50; V(c, c) = 0.25;
    U = U + 0.02*(r - 0.5); V = V + 0.02*(r - 0.5);
    for s = 1:STEPS
        uvv = (U.*V).*V;
        Un = U + DT*((DU*lap(U) - uvv) + F*(1 - U));
        Vn = V + DT*((DV*lap(V) + uvv) - (F + k)*V);
        U = Un; V = Vn;
    end
end

function ascii_map(V, N)
    chars = ' .:-=+*#%@'; rows = 24; cols = 48;
    for i = 0:rows-1
        row = blanks(cols);
        for j = 0:cols-1
            v = V(floor(i*N/rows) + 1, floor(j*N/cols) + 1);
            idx = floor(min(9, max(0, v/0.4*9.999)));
            row(j + 1) = chars(idx + 1);
        end
        fprintf('   |%s|\n', row);
    end
end

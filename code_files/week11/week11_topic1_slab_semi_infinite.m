% Week 11 - Topic 1: Unsteady 1D Diffusion - Semi-Infinite Medium and Finite Slab
% Lecture (Part 1):
%   * Fick's second law (1D, no reaction, no bulk motion): dc/dt = D d2c/dz2
%   * semi-infinite medium, c(z,0) = c0, c(0,t) = cs, c(inf,t) = c0  (Laplace transform):
%       (c - c0)/(cs - c0) = erfc( z / (2 sqrt(D t)) )
%       surface flux  N(0,t) = (cs - c0) sqrt(D/(pi t))       (decays as t^-1/2)
%       uptake per area  W/S = 2 (cs - c0) sqrt(D t / pi)       (grows as t^1/2)
%   * finite slab 0 < z < L, c = cs on both faces, Y = (c - cs)/(c0 - cs):
%       Y = (4/pi) sum_k 1/(2k-1) sin((2k-1) pi z/L) exp(-(2k-1)^2 pi^2 D t / L^2)
%       fractional uptake  M(t)/M_inf = 1 - sum_k 8/((2k-1)^2 pi^2) exp(-(2k-1)^2 pi^2 Fo),  Fo = D t/L^2
%   * case study (lecture): P diffusion into Si, cs = 2.5e20 cm^-3, target 2.5e18 cm^-3,
%     D = 6.5e-13 cm^2/s at 1373 K, t = 1 h  ->  erfc(phi) = 0.01, phi = 1.82, z = 1.76 um
% Run: week11_topic1_slab_semi_infinite   (MATLAB R2016b or later, local functions at the end)

fprintf('=== 1. Semi-infinite medium: profile, flux, uptake ===\n');
D = 1.0e-9; dc = 1.0;
for t = [10 100 1000]
    fprintf('t = %7.0f s: sqrt(Dt) = %7.1f um, N(0) = %.3e mol/m2/s, uptake = %.3e mol/m2\n', ...
        t, sqrt(D*t)*1e6, dc*sqrt(D/(pi*t)), 2*dc*sqrt(D*t/pi));
end
fprintf('  N(0) x sqrt(t) = dc sqrt(D/pi) = %.4e for every t\n', dc*sqrt(D/pi));

fprintf('\n=== 2. Case: P doping of Si (lecture) ===\n');
cs = 2.5e20; ct = 2.5e18; Dp = 6.5e-13; tt = 3600;
phi = erfc_inv_bisect(ct/cs);
fprintf('erfc(phi) = %.3f  ->  phi = %.3f\n', ct/cs, phi);
fprintf('depth for 2.5e18 cm^-3 after 1 h at 1373 K: z = %.2f um   (lecture: 1.76 um)\n', 2*phi*sqrt(Dp*tt)*1e4);
for hrs = [0.25 1 4]
    fprintf('  t = %4.2f h -> z = %.2f um  (depth ~ sqrt(t))\n', hrs, 2*phi*sqrt(Dp*hrs*3600)*1e4);
end

fprintf('\n=== 3. Finite slab: Fourier series vs Crank-Nicolson ===\n');
for Fo = [0.01 0.05 0.2]
    Y = slab_cn(Fo, 100, 2000);
    zz = (0:100)/100;
    err = max(abs(Y - slab_series(zz, Fo, 1, 1, 200)));
    fprintf('Fo = %4.2f: Y(centre) series = %.5f, CN = %.5f, max |diff| = %.1e\n', ...
        Fo, slab_series(0.5, Fo, 1, 1, 200), Y(51), err);
end
fprintf('terms needed at t = 0+ (Gibbs): the series converges slowly near the faces;\n');
for nt = [1 5 50]
    fprintf('  %3d terms: Y(z/L = 0.02, Fo = 0) = %.3f (exact 1)\n', nt, slab_series(0.02, 0, 1, 1, nt));
end

fprintf('\n=== 4. When is a slab ''semi-infinite''? ===\n');
fprintf('  Fo      exact M/Minf   short-time 4 sqrt(Fo/pi)   error\n');
for Fo = [0.001 0.01 0.03 0.05 0.1 0.2]
    ex = slab_uptake(Fo, 200); st = 4*sqrt(Fo/pi);
    fprintf('  %5.3f   %.4f         %.4f                  %6.2f%%\n', Fo, ex, st, 100*(st-ex)/ex);
end
fprintf('-> the two faces do not ''see'' each other until Fo ~ 0.05 (error about 0.1%%)\n');

% ------------------------------------------------------------------ local functions
function x = erfc_inv_bisect(y)
    lo = 0; hi = 10;
    for i = 1:200
        mid = 0.5*(lo + hi);
        if erfc(mid) > y, lo = mid; else, hi = mid; end
    end
    x = 0.5*(lo + hi);
end

function Y = slab_series(z, t, D, L, nterms)
    Y = zeros(size(z));
    for k = 1:nterms
        m = 2*k - 1;
        Y = Y + 4/(m*pi) * sin(m*pi*z/L) * exp(-(m*pi/L)^2*D*t);
    end
end

function M = slab_uptake(Fo, nterms)
    s = 0;
    for k = 1:nterms
        m = 2*k - 1;
        s = s + 8/(m^2*pi^2) * exp(-(m*pi)^2*Fo);
    end
    M = 1 - s;
end

function Y = slab_cn(FoEnd, N, steps)
    h = 1/N; dt = FoEnd/steps; r = dt/h^2;
    Y = ones(1, N+1); Y(1) = 0; Y(end) = 0;
    n = N - 1;
    A = spdiags([-r/2*ones(n,1), (1+r)*ones(n,1), -r/2*ones(n,1)], -1:1, n, n);
    for s = 1:steps
        d = r/2*Y(1:N-1) + (1-r)*Y(2:N) + r/2*Y(3:N+1);
        Y(2:N) = (A \ d.').';
    end
end

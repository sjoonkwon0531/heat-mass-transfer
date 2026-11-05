% Week 11 - Topic 3: Sturm-Liouville Eigenfunctions in a Cylinder - Bessel Functions and the Heated Wire
% Lecture (Part 2):
%   * Sturm-Liouville operator L = (1/w) [d/dx (p d/dx) + q]; self-adjoint with homogeneous BCs
%     -> real eigenvalues, orthogonal eigenfunctions <u_m, u_n> = int u_m u_n w dx = 0 (m != n)
%   * cylinder (w = r, p = r, q = 0): (1/r)(r F')' = -lambda^2 F  ->  F = a J0(lambda r)  (Y0 diverges at r = 0)
%     Type 1  F(1) = 0          : J0(lambda) = 0           lambda = 2.405, 5.520, 8.654, ...
%     Type 2  F'(1) = 0         : J1(lambda) = 0           lambda = 0, 3.832, 7.016, 10.173, ...
%     Type 3  F'(1) + Bi F(1) = 0: lambda J1(lambda) = Bi J0(lambda)
%     normalisation  int_0^1 J0(lambda r)^2 r dr = [J0(lambda)^2 + J1(lambda)^2]/2
%   * Ex 1 (lecture): electrically heated wire, dTheta/dt = (1/r)(r Theta_r)_r + 1,
%     Theta(r,0) = 0, Theta_r(0) = 0, Theta_r(1) + Bi Theta(1) = 0  (finite Fourier transform):
%     Theta = 2 sum_n J1(l_n) J0(l_n r) / (l_n^3 J0(l_n)^2 (1 + (Bi/l_n)^2)) (1 - exp(-l_n^2 t))
%     steady state Theta_ss = 1/(2 Bi) + (1 - r^2)/4
%   Dimensionless: Theta = k (T - T_inf)/(q''' R^2), t = alpha t/R^2, Bi = h R/k.
% MATLAB's built-in besselj is used; fzero brackets each root found on a fine grid.
% Run: week11_topic3_bessel_cylinder   (MATLAB R2016b or later)

fprintf('=== 1. Eigenvalues for the three boundary-condition types ===\n');
fprintf('  Type 1 (J0 = 0): %s\n', fmtv(eigenvalues(1, 0, 4)));
fprintf('  Type 2 (J1 = 0): %s\n', fmtv(eigenvalues(2, 0, 4)));
for Bi = [0.1 1.0 10.0]
    fprintf('  Type 3, Bi = %4.1f: %s\n', Bi, fmtv(eigenvalues(3, Bi, 4)));
end

fprintf('\n=== 2. Orthogonality (weight w = r) and normalisation ===\n');
lam = eigenvalues(1, 0, 4);
for i = 1:3
    fprintf('  ');
    for j = 1:3
        fprintf(' %+.6f', integral(@(r) besselj(0, lam(i)*r).*besselj(0, lam(j)*r).*r, 0, 1));
    end
    fprintf('\n');
end
l1 = lam(1);
fprintf('  int J0(l1 r)^2 r dr = %.6f, formula (J0^2 + J1^2)/2 = %.6f\n', ...
    integral(@(r) besselj(0, l1*r).^2.*r, 0, 1), (besselj(0, l1)^2 + besselj(1, l1)^2)/2);

fprintf('\n=== 3. Heated wire (Ex 1): series vs finite volume ===\n');
Bi = 1.0;
lams = eigenvalues(3, Bi, 30);
for t = [0.05 0.2 1.0]
    th = wire_fd(t, Bi, 60);
    fprintf('  t = %4.2f: centre series = %.5f, FV = %.5f;  surface series = %.5f\n', ...
        t, wire_series(0, t, Bi, lams), th(1), wire_series(1, t, Bi, lams));
end
fprintf('  steady state 1/(2Bi) + 1/4 = %.5f; series at t = 10: %.5f\n', 1/(2*Bi) + 0.25, wire_series(0, 10, Bi, lams));
target = 0.95*(1/(2*Bi) + 0.25); lo = 0; hi = 10;
for k = 1:60
    mid = 0.5*(lo + hi);
    if wire_series(0, mid, Bi, lams) < target, lo = mid; else, hi = mid; end
end
fprintf('  time to reach 95%% of the steady centre value: t = %.3f  (one-term estimate 3/lambda1^2 = %.3f)\n', mid, 3/lams(1)^2);

fprintf('\n=== 4. Case: thin Pt wire, R = 25 um, in still air ===\n');
k = 71.6; alpha = 2.5e-5; h = 300; q = 1e9; R = 25e-6;
Biw = h*R/k; l1w = eigenvalues(3, Biw, 1);
fprintf('  Bi = hR/k = %.2e -> nearly uniform temperature (lumped), lambda1 = %.4f\n', Biw, l1w);
fprintf('  steady rise T - T_inf = q R / (2 h) = %.1f K; time constant R^2/(alpha lambda1^2) = %.2f ms (lumped rho c R/(2h))\n', ...
    q*R/(2*h), R^2/(alpha*l1w^2)*1e3);

% ------------------------------------------------------------------ local functions
function s = fmtv(v)
    s = ['[' strjoin(arrayfun(@(x) sprintf('%.4f', x), v, 'UniformOutput', false), ', ') ']'];
end

function lam = eigenvalues(bc, Bi, n)
    switch bc
        case 1, f = @(x) besselj(0, x);
        case 2, f = @(x) besselj(1, x);
        otherwise, f = @(x) x.*besselj(1, x) - Bi*besselj(0, x);
    end
    x = 1e-9:0.01:20; fx = f(x);
    idx = find(fx(1:end-1).*fx(2:end) < 0);
    lam = arrayfun(@(i) fzero(f, [x(i) x(i+1)]), idx);
    if bc == 2, lam = [0 lam]; end
    lam = lam(1:min(n, numel(lam)));
end

function s = wire_series(r, t, Bi, lams)
    s = 0;
    for l = lams
        s = s + 2*besselj(1, l)*besselj(0, l*r)/(l^3*besselj(0, l)^2*(1 + (Bi/l)^2))*(1 - exp(-l^2*t));
    end
end

function th = wire_fd(tEnd, Bi, N)
    dr = 1/N; steps = floor(tEnd/(0.2*dr^2)) + 1; dt = tEnd/steps;
    rw = (0:N-1)*dr; re = (1:N)*dr; rc = ((0:N-1) + 0.5)*dr;
    th = zeros(1, N);
    for s = 1:steps
        fw = [0, rw(2:N).*(th(2:N) - th(1:N-1))/dr];
        Ts = th(N)/(1 + Bi*dr/2);
        fe = [re(1:N-1).*(th(2:N) - th(1:N-1))/dr, re(N)*(Ts - th(N))/(dr/2)];
        th = th + dt*((fe - fw)./(rc*dr) + 1);
    end
end

% Week 11 - Topic 4: Spherical Coordinates - Reaction in a Catalyst Pellet and Legendre Polynomials
% Lecture (Part 3):
%   * radial problem (w = r^2, p = r^2): (1/r^2)(r^2 F')' = -lambda^2 F -> F = sin(lambda r)/r (spherical Bessel j0)
%       Type 1 F(1) = 0: lambda_n = n pi;  Type 2 F'(1) = 0: lambda = tan(lambda);
%       Type 3 F'(1) + A F(1) = 0: lambda = (1 - A) tan(lambda)
%   * Ex 1, steady first-order reaction in a sphere, Da = k R^2/D (= phi^2, Thiele modulus squared):
%       Theta = sinh(sqrt(Da) r)/(r sinh(sqrt(Da))),  effectiveness eta = 3 (phi coth phi - 1)/phi^2
%   * Ex 2, transient start-up, Theta(r,0) = 0:
%       Theta = steady + 2 sum_n (n pi)(-1)^n/((n pi)^2 + Da) exp(-((n pi)^2 + Da) t) sin(n pi r)/r
%   * polar problem (eta = cos(theta)): Legendre polynomials, int P_n P_m = 2/(2n+1) delta_nm
%   * Ex 3, sphere (k_B) in a matrix (k_A) under a uniform gradient, gamma = k_B/k_A:
%       inside gradient = 3/(2 + gamma);  Maxwell: k_eff/k_A = (gamma + 2 + 2f(gamma - 1))/(gamma + 2 - f(gamma - 1))
% Run: week11_topic4_sphere_reaction_legendre   (MATLAB R2016b or later)

fprintf('=== 1. Steady reaction in a sphere: profile and effectiveness factor ===\n');
for Da = [0.25 1 9 100]
    phi = sqrt(Da);
    fprintf('  Da = %6.2f (phi = %5.2f): centre Theta = %.4f, eta = %.4f, large-phi limit 3/phi = %.4f\n', ...
        Da, phi, steady_profile(0, Da), 3*(phi/tanh(phi) - 1)/phi^2, 3/phi);
end

fprintf('\n=== 2. Transient start-up (Ex 2): series vs finite volume, Da = 9 ===\n');
Da = 9;
for t = [0.02 0.1 0.5]
    th = fv_transient(t, Da, 60);
    fprintf('  t = %4.2f: centre series = %.5f, FV = %.5f  (steady %.5f)\n', t, transient(0, t, Da, 400), th(1), steady_profile(0, Da));
end
fprintf('  check t = 0: Theta(0.5, 0) = %.4f (should be 0)\n', transient(0.5, 0, Da, 4000));
fprintf('  slowest decay rate pi^2 + Da = %.3f: reaction speeds up the approach to steady state\n', pi^2 + Da);

fprintf('\n=== 3. Radial eigenvalues of a sphere ===\n');
fprintf('  Type 1: n pi = [%.4f, %.4f, %.4f]\n', pi, 2*pi, 3*pi);
g = @(x) sin(x) - x.*cos(x);
t2 = arrayfun(@(k) fzero(g, [(k+0.5)*pi-0.5, (k+0.5)*pi-1e-9]), 1:3);
fprintf('  Type 2 (lambda = tan lambda): [%.4f, %.4f, %.4f]\n', t2);

fprintf('\n=== 4. Legendre polynomials: orthogonality ===\n');
for n = 0:3
    fprintf('  ');
    for m = 0:3
        fprintf(' %+.4f', integral(@(x) legendreP(n, x).*legendreP(m, x), -1, 1));
    end
    fprintf('    2/(2n+1) = %.4f\n', 2/(2*n+1));
end

fprintf('\n=== 5. Sphere in a gradient: Maxwell effective conductivity ===\n');
fprintf('  gamma = kB/kA   inside gradient 3/(2+gamma)   k_eff/k_A at f = 0.1, 0.3\n');
mx = @(g, f) (g + 2 + 2*f*(g - 1))./(g + 2 - f*(g - 1));
for gm = [0 0.1 1 10 100]
    fprintf('  %7.1f          %.4f                  %.4f, %.4f\n', gm, 3/(2+gm), mx(gm, 0.1), mx(gm, 0.3));
end
fprintf('  case: thermal interface material, epoxy kA = 0.2 W/m/K with alumina kB = 30 W/m/K\n');
for f = [0.1 0.3 0.5]
    fprintf('    f = %.1f: k_eff = %.3f W/m/K\n', f, 0.2*mx(150, f));
end
fprintf('  -> even very conductive fillers raise k_eff by at most (1 + 2f)/(1 - f) in the dilute model\n');

% ------------------------------------------------------------------ local functions
function v = steady_profile(r, Da)
    p = sqrt(Da);
    if r < 1e-12, v = p/sinh(p); else, v = sinh(p*r)/(r*sinh(p)); end
end

function s = transient(r, t, Da, nterms)
    s = steady_profile(r, Da);
    for n = 1:nterms
        a = n*pi;
        if r < 1e-12, shape = a; else, shape = sin(a*r)/r; end
        s = s + 2*a*(-1)^n/(a^2 + Da)*exp(-(a^2 + Da)*t)*shape;
    end
end

function th = fv_transient(tEnd, Da, N)
    dr = 1/N; steps = floor(tEnd/(0.15*dr^2)) + 1; dt = tEnd/steps;
    i = 0:N-1;
    vol = ((i+1).^3 - i.^3)*dr^3/3;
    aw = (i*dr).^2; ae = ((i+1)*dr).^2;
    th = zeros(1, N);
    for s = 1:steps
        fw = [0, aw(2:N).*(th(2:N) - th(1:N-1))/dr];
        fe = [ae(1:N-1).*(th(2:N) - th(1:N-1))/dr, ae(N)*(1 - th(N))/(dr/2)];
        th = th + dt*((fe - fw)./vol - Da*th);
    end
end

function p = legendreP(n, x)
    p0 = ones(size(x)); p1 = x;
    if n == 0, p = p0; return; end
    for k = 1:n-1
        p2 = ((2*k + 1)*x.*p1 - k*p0)/(k + 1);
        p0 = p1; p1 = p2;
    end
    p = p1;
end

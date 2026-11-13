% Week 12 - Topic 1: Laminar Boundary Layers - Blasius Similarity and the Concentration Boundary Layer
% Lecture (Part 1):
%   * similarity variable eta = y sqrt(v_inf/(nu x)), psi = sqrt(nu x v_inf) f(eta), vx/v_inf = f'
%   * Blasius (lecture form): 2 f''' + f f'' = 0, f(0) = f'(0) = 0, f'(inf) = 1 -> f''(0) = 0.332057
%   * concentration: C'' + (Sc/2) f C' = 0, C(0) = 0, C(inf) = 1;  C'(0) = 1/int exp(-(Sc/2) int f)
%   * Sh_x = C'(0) Re_x^(1/2) ~ 0.332 Sc^(1/3) Re_x^(1/2)
% Run: week12_topic1_blasius_concentration_bl   (MATLAB R2016b or later)

H = 0.001; ETA_MAX = 12;
fprintf('=== 1. Blasius: shooting for f''''(0) ===\n');
lo = 0.2; hi = 0.5;
for k = 1:50
    mid = 0.5*(lo + hi);
    U = blasius(mid, H, ETA_MAX);
    if U(end, 2) < 1, lo = mid; else, hi = mid; end
end
a = 0.5*(lo + hi);
U = blasius(a, H, ETA_MAX);
fprintf('  f''''(0) = %.6f   (lecture: 0.332057)\n', a);
i99 = find(U(:, 2) >= 0.99, 1);
fprintf('  f''(eta) = 0.99 at eta = %.3f  ->  delta_99 = %.2f x / Re_x^(1/2)\n', (i99-1)*H, (i99-1)*H);
fprintf('  far field: f(12) - 12 = %.4f  (displacement, lecture b = 1.7208)\n', U(end, 1) - 12);

fprintf('\n=== 2. Concentration boundary layer: C''(0) versus Sc ===\n');
fprintf('    Sc      C''(0)    0.332 Sc^(1/3)   ratio\n');
F = [0; cumsum(0.5*(U(2:end,1) + U(1:end-1,1))*H)];
for Sc = [0.6 0.7 1 2 10 100 1000]
    g = exp(-0.5*Sc*F);
    I = sum(0.5*(g(2:end) + g(1:end-1))*H);
    ap = 0.332*Sc^(1/3);
    fprintf('  %7.1f  %.5f   %.5f         %.4f\n', Sc, 1/I, ap, (1/I)/ap);
end
fprintf('  -> Sh_x = C''(0) Re_x^(1/2); the Sc^(1/3) law is within 2%% for Sc >= 0.6\n');

fprintf('\n=== 3. Example: local and mean Sherwood numbers on a 0.2 m plate ===\n');
nu = 1.5e-5; D = 6.0e-6; v = 3.0; L = 0.2; Sc = nu/D;
for x = [0.05 0.1 0.2]
    Re = v*x/nu; Sh = 0.332*Sc^(1/3)*sqrt(Re);
    fprintf('  x = %4.2f m: Re_x = %8.0f, Sh_x = %6.1f, kc = %.3f cm/s\n', x, Re, Sh, Sh*D/x*100);
end
ReL = v*L/nu;
fprintf('  mean over L: Sh_L = 0.664 Sc^(1/3) Re_L^(1/2) = %.1f  (= 2 x local value at x = L)\n', 0.664*Sc^(1/3)*sqrt(ReL));
fprintf('  thickness ratio delta_M/delta_c ~ Sc^(1/3) = %.3f\n', Sc^(1/3));

function U = blasius(a, H, ETA_MAX)
    n = round(ETA_MAX/H);
    U = zeros(n+1, 3); u = [0 0 a]; U(1, :) = u;
    rhs = @(u) [u(2) u(3) -0.5*u(1)*u(3)];
    for i = 1:n
        k1 = rhs(u); k2 = rhs(u + 0.5*H*k1); k3 = rhs(u + 0.5*H*k2); k4 = rhs(u + H*k3);
        u = u + H/6*(k1 + 2*k2 + 2*k3 + k4);
        U(i+1, :) = u;
    end
end

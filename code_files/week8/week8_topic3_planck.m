% Week 8 - Topic 3: Planck's Law, Wien's Displacement, Stefan-Boltzmann
% Cavity mode counting: g(nu) dnu = 8 pi V nu^2/c^3 dnu.
% Equipartition (<E> = kB T) -> Rayleigh-Jeans -> ultraviolet catastrophe.
% Planck (E_n = n h nu) -> <E> = h nu/(exp(h nu/kB T) - 1) ->
%   F_lambda = (2 pi h c^2/lambda^5)/(exp(hc/lambda kB T) - 1)
% Checks: sigma = 2 pi^5 kB^4/(15 h^3 c^2) = 5.670e-8; Wien x = 4.965 ->
% lambda_C T = 2.898e-3 m K; frequency form x = 2.821; Sun -> 500 nm.

clear; clc;

H = 6.62607015e-34; C = 2.99792458e8; KB = 1.380649e-23;

% --- Stefan-Boltzmann constant ---
sigma = 2*pi^5*KB^4 / (15*H^3*C^2);
fprintf('sigma = %.4e W/m^2 K^4 (lecture 5.670e-8)\n', sigma);

% Bose-Einstein integral check: int x^3/(e^x - 1) = pi^4/15
x = linspace(1e-6, 60, 400001);
I = trapz(x, x.^3 ./ expm1(x));
fprintf('int x^3/(e^x-1) dx = %.6f (pi^4/15 = %.6f)\n\n', I, pi^4/15);

% --- Wien displacement: solve x e^x/(e^x - 1) = a by bisection ---
x5 = solve_wien(5); x3 = solve_wien(3);
b = H*C/(x5*KB);
fprintf('Wien (lambda): x = %.4f (lecture 4.965) -> lambda_C T = %.4f mm K\n', x5, b*1e3);
fprintf('Wien (nu)    : x = %.4f (lecture 2.821) -> nu_C = 2.821 kB T/h\n', x3);
names = {'Sun', 'human body', 'furnace'}; temps = [5800 310 1500];
for i = 1:3
    fprintf('  %-11s T = %6.0f K -> lambda_C = %8.1f nm\n', ...
            names{i}, temps(i), b/temps(i)*1e9);
end

% --- total flux: numerical Planck integral vs sigma T^4 ---
T = 5800;
lam = linspace(10e-9, 100e-6, 20001);
Flam = 2*pi*H*C^2 ./ lam.^5 ./ expm1(H*C ./ (lam*KB*T));
fprintf('\nT = %d K: integral F_lambda = %.4e, sigma T^4 = %.4e W/m^2\n', ...
        T, trapz(lam, Flam), sigma*T^4);

% --- Rayleigh-Jeans vs Planck at 2000 K ---
fprintf('\nF_lambda at 2000 K (W/m^2 um):  lambda    Planck     Rayleigh-Jeans\n');
for lam_um = [0.2 0.5 1.0 1.449 3.0 10.0]
    l = lam_um*1e-6;
    P  = 2*pi*H*C^2 / l^5 / expm1(H*C/(l*KB*2000));
    RJ = 2*pi*C*KB*2000 / l^4;
    fprintf('  %8.3f um  %12.4e  %14.4e\n', lam_um, P*1e-6, RJ*1e-6);
end
fprintf('  -> RJ diverges as lambda^-4; Planck peaks at %.3f um and decays.\n', ...
        b/2000*1e6);

function x = solve_wien(a)
    f = @(x) x.*exp(x)./expm1(x) - a;
    lo = 0.5; hi = 10;
    for it = 1:200
        mid = (lo + hi)/2;
        if f(lo)*f(mid) <= 0, hi = mid; else, lo = mid; end
    end
    x = (lo + hi)/2;
end

% Week 10 - Topic 3: Diffusion with Reaction: Liquid Film (Hatta) and CVD Growth (Grove Model)
% Lecture (Part 1):
%   * gas A absorbed into liquid B with first-order homogeneous reaction R_A = -k1 c_A:
%       D_AB d^2c_A/dz^2 - k1 c_A = 0,  c_A(0) = c_A0,  c_A(delta) = 0
%       c_A(z) = c_A0 [cosh(phi z/delta) - sinh(phi z/delta)/tanh(phi)],  phi = delta sqrt(k1/D_AB)
%       N_Az|0 = (D_AB c_A0/delta) * phi/tanh(phi)
%     phi is the Hatta number Ha; E = Ha/tanh(Ha) is the enhancement over physical absorption
%     (the lecture labels this flux ratio "Hatta number").
%     large k1: N_Az -> sqrt(D_AB k1) c_A0, so k_c ~ D^(1/2) (vs k_c ~ D for the film model)
%   * CVD growth (Grove): gas-phase transfer F1 = h_g (C_g - C_s), surface reaction F2 = k_s C_s
%       steady state: F1 = F2 -> growth rate = (h_g k_s/(h_g + k_s)) C_g / rho
%       low T: k_s = k_s0 exp(-Ea/kT) << h_g -> reaction limited (Ea ~ 1.9 eV)
%       high T: k_s >> h_g ~ T^n (n = 1.5-2) -> mass-transport limited
% CVD parameter values are illustrative.
function week10_topic3_reaction_film_cvd()
    kB = 8.617333262e-5;
    fprintf(' Ha      E = Ha/tanh(Ha)   E from FDM    large-Ha limit (=Ha)\n');
    for Ha = [0.1 0.5 1 2 5 10]
        [~, E] = filmFDM(Ha, 400);
        fprintf('%5.1f   %12.5f   %10.5f   %10.3f\n', Ha, Ha/tanh(Ha), E, Ha);
    end
    u = filmFDM(3, 400);
    fprintf('profile check Ha = 3, z/delta = 0.5: %.5f FDM: %.5f\n', cosh(1.5) - sinh(1.5)/tanh(3), u(201));
    k1 = 100; delta = 1e-4;
    fprintf('\n D (m^2/s)   film k_c = D/delta   reaction k_c = sqrt(D k1)\n');
    for D = [5e-10 1e-9 2e-9 4e-9], fprintf(' %.1e    %.3e         %.3e\n', D, D/delta, sqrt(D*k1)); end
    fprintf(' doubling D: film x2, reaction x %.3f\n', sqrt(2));
    fprintf('\nGrove model (illustrative constants): rate ~ h_g k_s/(h_g + k_s)\n');
    fprintf('  T (K)   k_s        h_g        rate       regime\n');
    grove = @(T) deal(1e9*exp(-1.9./(kB*T)), 0.05*(T/1000).^1.75);
    for T = 700:100:1300
        [ks, hg] = grove(T); r = hg*ks/(hg + ks);
        if ks < 0.1*hg, reg = 'reaction-limited'; elseif ks > 10*hg, reg = 'transport-limited'; else, reg = 'mixed'; end
        fprintf('  %5d  %9.3e  %9.3e  %9.3e  %s\n', T, ks, hg, r, reg);
    end
    [k1s, h1] = grove(700); [k2s, h2] = grove(750);
    r1 = h1*k1s/(h1 + k1s); r2 = h2*k2s/(h2 + k2s);
    fprintf('  apparent Ea from the low-T slope = %.3f eV (input 1.9 eV)\n', -kB*log(r2/r1)/(1/750 - 1/700));
end

function [u, E] = filmFDM(Ha, n)
    % u'' = Ha^2 u on [0,1], u(0) = 1, u(1) = 0
    h = 1/n; m = n - 1;
    A = spdiags([ones(m,1), -(2 + (Ha*h)^2)*ones(m,1), ones(m,1)], -1:1, m, m);
    b = zeros(m, 1); b(1) = -1;
    u = [1; A\b; 0];
    E = -(-3*u(1) + 4*u(2) - u(3))/(2*h);
end

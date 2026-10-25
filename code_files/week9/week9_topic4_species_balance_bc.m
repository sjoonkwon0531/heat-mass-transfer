% Week 9 - Topic 4: Species Balance, Interface Boundary Conditions and a CVD Film
% Henry's law p_A = x_A H_A(T) (lecture table, bar); Raoult p_A = x_A p_A*(T)
% W CVD: 3H2 + WF6 -> W + 6HF  ->  N_A(1 + 2 y_A) = -c D dy_A/dz
%   diffusion-limited: N_A = (c D/(2 delta)) ln[(1 + 2 y_A0)/(1 + 2 y_Ad)]
%   finite surface rate: N_A = k_s c y_Ad,  Da = k_s delta/D
Tt = [273 280 290 300 310 320];
H_O2 = [25500 30500 37600 45700 52500 56800];
H = interp1(Tt, H_O2, 298); x = 0.21/H; c_O2 = x*55.4e3;
fprintf('O2 in water at 298 K: H = %.0f bar, x = %.3e, c = %.3f mol/m^3 = %.2f mg/L\n', H, x, c_O2, c_O2*32);

c = 101325/(8.314462618*700); D = 1e-4; delta = 1e-3; y0 = 0.10;
fluxA = @(yd) c*D/(2*delta)*log((1 + 2*y0)./(1 + 2*yd));
Na = fluxA(0); Nf = c*D*y0/delta;

% finite differences + Picard iteration on the face coefficient 1/(1+2y)
n = 200; y = linspace(y0, 0, n + 1)';
for it = 1:200
    kf = 1./(1 + (y(1:end-1) + y(2:end)));
    A = spalloc(n + 1, n + 1, 3*(n + 1)); b = zeros(n + 1, 1);
    A(1,1) = 1; b(1) = y0; A(end,end) = 1; b(end) = 0;
    for i = 2:n
        A(i, i-1) = kf(i-1); A(i, i) = -(kf(i-1) + kf(i)); A(i, i+1) = kf(i);
    end
    y = A\b;
end
h = delta/n; Nn = -c*D*(y(2) - y(1))/h/(1 + (y(1) + y(2)));
fprintf('\nW CVD: analytic N_A = %.5e, FDM N_A = %.5e, pure Fick = %.5e mol/m^2 s\n', Na, Nn, Nf);
z = linspace(0, delta, n + 1)';
yan = 0.5*((1 + 2*y0).^(1 - z/delta) - 1);
figure; plot(z*1e3, y, 'o', z*1e3, yan, '-', z*1e3, y0*(1 - z/delta), '--', 'LineWidth', 1.5);
xlabel('z (mm)'); ylabel('y_{WF6}'); legend('FDM', 'analytic', 'pure Fick (linear)');
set(gca, 'FontName', 'Arial Narrow', 'FontSize', 14);
for Da = [0.1 1 10 100]
    ks = Da*D/delta;
    yd = fzero(@(s) fluxA(s) - ks*c*s, [0 y0]);
    fprintf('  Da = %6.1f: y_A(surface) = %.4f, N_A = %.4e (%5.1f%% of limit)\n', Da, yd, ks*c*yd, ks*c*yd/Na*100);
end

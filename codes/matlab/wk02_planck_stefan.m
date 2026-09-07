% Wk02 - Planck spectrum -> Stefan-Boltzmann (numeric check)
% Author: Prof. S. Joon Kwon - SPMDL - SKKU
clear; clc;

h = 6.626e-34; c = 2.998e8; kB = 1.381e-23; SB = 5.670e-8;
lam = logspace(-7.3, -4.3, 2000);
Ts = [2000 3000 4000 5000 5778];

figure(1); hold on;
for T = Ts
    x = h*c ./ (lam*kB*T);
    B = 2*pi*h*c^2 ./ lam.^5 ./ (exp(x) - 1);
    P_num = trapz(lam, B);
    P_sb = SB * T^4;
    lam_max = 2.898e-3 / T;
    plot(lam*1e6, B/1e12, 'LineWidth', 2, ...
         'DisplayName', sprintf('T = %d K', T));
    xline(lam_max*1e6, ':', 'Color', [0.5 0.5 0.5]);
    fprintf('T=%5d K: num = %.3e, SB = %.3e, ratio = %.4f\n', ...
            T, P_num, P_sb, P_num/P_sb);
end
hold off; grid on;
set(gca, 'XScale', 'log');
xlabel('wavelength [\mum]'); ylabel('exitance [MW/m^2/\mum]');
title('Planck spectra: area = \sigmaT^4');
legend('Location','northeast');

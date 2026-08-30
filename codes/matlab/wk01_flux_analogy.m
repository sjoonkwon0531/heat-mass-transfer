% Wk01 - Transport analogy: Newton / Fourier / Fick (Pr, Sc, Le)
% Author: Prof. S. Joon Kwon - SPMDL - SKKU
clear; clc;

names = {'Air (25C)','Water (25C)','Glycerin','Engine oil'};
mu  = [1.8e-5, 8.9e-4, 0.95,  0.80];
k   = [0.026,  0.61,   0.29,  0.145];
D   = [2.5e-5, 2.0e-9, 1e-11, 1e-10];
rho = [1.18,   997,    1260,  888];
cp  = [1005,   4180,   2430,  1880];

nu    = mu ./ rho;
alpha = k ./ (rho .* cp);
Pr = nu ./ alpha;  Sc = nu ./ D;  Le = alpha ./ D;

fprintf('%-14s %10s %10s %10s %8s %10s %8s\n', ...
        'Material','nu','alpha','D','Pr','Sc','Le');
for i = 1:numel(names)
    fprintf('%-14s %10.2e %10.2e %10.2e %8.2f %10.1f %8.1f\n', ...
        names{i}, nu(i), alpha(i), D(i), Pr(i), Sc(i), Le(i));
end

figure(1);
Y = [nu; alpha; D]';
b = bar(Y); set(gca,'YScale','log');
set(gca,'XTickLabel',names);
legend('\nu (momentum)','\alpha (heat)','D (mass)','Location','best');
ylabel('diffusivity [m^2/s]');
title('One unit (m^2/s), three transports'); grid on;

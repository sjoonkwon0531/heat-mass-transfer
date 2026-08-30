% Wk01 - 1D random walk -> Gaussian diffusion
% Author: Prof. S. Joon Kwon - SPMDL - SKKU
clear; clc; rng(1);

NP = 20000; NSTEP = 400; ELL = 1.0;
pos = zeros(NP,1); msd = zeros(NSTEP+1,1);

for n = 1:NSTEP
    step = ELL * (2*(rand(NP,1) < 0.5) - 1);
    pos = pos + step;
    msd(n+1) = mean(pos.^2);
end

sigma = ELL * sqrt(NSTEP);
xg = linspace(-4*sigma, 4*sigma, 400);
gauss = exp(-xg.^2/(2*sigma^2)) / (sigma*sqrt(2*pi));

figure(1);
subplot(1,2,1);
histogram(pos, 60, 'Normalization','pdf'); hold on;
plot(xg, gauss, 'r-', 'LineWidth', 2); hold off;
xlabel('x'); ylabel('P(x)');
title(sprintf('%d walkers after %d steps', NP, NSTEP));
legend('walkers','Gaussian');

subplot(1,2,2);
t = 0:NSTEP;
plot(t, msd, 'b-', 'LineWidth', 2); hold on;
plot(t, ELL^2*t, 'r--', 'LineWidth', 2); hold off;
xlabel('step n (time)'); ylabel('<x^2>');
title('MSD grows linearly in t');
legend('simulated','theory: n \cdot ell^2', 'Location','northwest');

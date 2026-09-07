% Wk02 - Drude model Monte-Carlo (1D)
% v_d converges to a*tau  ->  sigma = n q^2 tau / m
% Author: Prof. S. Joon Kwon - SPMDL - SKKU
clear; clc; rng(2);

NE = 5000; NSTEP = 3000; DT = 0.01;
TAU = 1.0; A = 0.5; U0 = 3.0;

v = U0 * randn(NE,1);
vd = zeros(NSTEP,1);
for n = 1:NSTEP
    sc = rand(NE,1) < DT/TAU;
    v(sc) = U0 * randn(sum(sc),1);
    v(~sc) = v(~sc) + A*DT;
    vd(n) = mean(v);
end

t = (0:NSTEP-1)*DT;
figure(1);
subplot(1,2,1);
plot(t, vd, 'b-'); hold on;
yline(A*TAU, 'r--', 'LineWidth', 2); hold off;
xlabel('time'); ylabel('<v>');
title('Drift velocity emerges from chaos');
legend('simulation','Drude a\tau','Location','southeast');

subplot(1,2,2);
histogram(v, 60, 'Normalization','pdf'); hold on;
xline(A*TAU, 'r--', 'LineWidth', 2); hold off;
xlabel('v'); ylabel('P(v)'); title('Shifted Maxwellian');

fprintf('simulated v_d = %.4f, Drude a*tau = %.4f\n', ...
        mean(vd(end/2:end)), A*TAU);

% Wk02 - Phonon dispersion of a 1D diatomic chain
% Author: Prof. S. Joon Kwon - SPMDL - SKKU
clear; clc;

C = 1.0; m1 = 1.0;
ratios = [1, 2, 4];
ka = linspace(-pi/2, pi/2, 400);

figure(1);
for i = 1:numel(ratios)
    m2 = ratios(i) * m1;
    s = 1/m1 + 1/m2;
    root = sqrt(s^2 - 4*sin(ka).^2/(m1*m2));
    w_ac = sqrt(C*(s - root));
    w_op = sqrt(C*(s + root));
    subplot(1, numel(ratios), i);
    plot(ka, w_ac, 'b-', 'LineWidth', 2); hold on;
    plot(ka, w_op, 'r-', 'LineWidth', 2); hold off;
    title(sprintf('m2/m1 = %d', ratios(i)));
    xlabel('ka'); if i == 1, ylabel('\omega'); end
    legend('acoustic','optical','Location','south');
end
sgtitle('Diatomic chain: mass contrast opens a phonon band gap');

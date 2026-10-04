% Week 6 - Topic 4: The Graetz Problem - Eigenvalues, Entrance Region, Nu_inf
% Sturm-Liouville: (1/eta)*d/deta(eta*dPhi/deta) = -lam^2*(1-eta^2)*Phi,
%   Phi'(0) = 0, Phi(1) = 0 -> lam1 = 2.7044, ...; Nu_inf = lam1^2/2 = 3.656
% Leveque: Nu = 1.357*(R/z)^(1/3)*Pe^(1/3); L_T/R ~ 0.1*Pe.

function week6_topic4_graetz_entrance
    close all; clc
    % --- eigenvalues by scan + bisection on Phi(1; lam) ---
    eigs = [];
    prevL = 0.5; prevF = phiwall(0.5);
    lam = 0.6;
    while numel(eigs) < 5
        f = phiwall(lam);
        if prevF*f < 0
            lo = prevL; hi = lam; flo = prevF;
            for it = 1:60
                mid = (lo + hi)/2; fm = phiwall(mid);
                if flo*fm <= 0, hi = mid; else, lo = mid; flo = fm; end
            end
            eigs(end+1) = (lo + hi)/2; %#ok<AGROW>
        end
        prevL = lam; prevF = f; lam = lam + 0.1;
    end
    fprintf('Graetz eigenvalues: %s\n', sprintf('%8.4f', eigs));
    fprintf('lecture           :   2.7044   6.6790  10.6730  14.6710  18.6700\n');
    fprintf('Nu_inf = lam1^2/2 = %.3f (lecture 3.656)\n\n', eigs(1)^2/2);

    % --- Leveque constant & entrance decay ---
    C = 6/(gamma(1/3)*(9/2)^(1/3));
    fprintf('Leveque constant = %.4f (lecture 1.357), Gamma(1/3) = %.5f\n', C, gamma(1/3));

    Pe = 1000; zR = logspace(-1, 3, 200);
    Nu = 1.357*(1./zR).^(1/3)*Pe^(1/3);
    NuInf = eigs(1)^2/2;
    figure(1);
    loglog(zR, Nu, 'r-', 'LineWidth', 1.6); hold on
    yline(NuInf, 'k--');
    xline(0.1*Pe, 'b:');
    grid on; xlabel('z/R'); ylabel('Nu');
    legend('Leveque (slope -1/3)', 'Nu_\infty = 3.656', 'L_T/R = 0.1 Pe');
    title('Thermal entrance: Nu \sim z^{-1/3}, then saturation');

    fprintf('\nEntrance region at Pe = %g:\n', Pe);
    for z = [0.1 1 10 100]
        fprintf('  z/R = %6.1f: Nu_Leveque = %8.2f\n', z, 1.357*(1/z)^(1/3)*Pe^(1/3));
    end
    fprintf('Thermal entrance length L_T/R ~ 0.1*Pe = %g\n', 0.1*Pe);
end

function P = phiwall(lam)
    n = 4000; h = 1/n; eta = 1e-6;
    y = [1 - lam^2*eta^2/4; -lam^2*eta/2];
    while eta < 1 - 1e-12
        s = min(h, 1 - eta);
        k1 = rhs(eta, y, lam);
        k2 = rhs(eta + s/2, y + s/2*k1, lam);
        k3 = rhs(eta + s/2, y + s/2*k2, lam);
        k4 = rhs(eta + s, y + s*k3, lam);
        y = y + s/6*(k1 + 2*k2 + 2*k3 + k4);
        eta = eta + s;
    end
    P = y(1);
end

function dy = rhs(eta, y, lam)
    dy = [y(2); -lam^2*(1 - eta^2)*y(1) - y(2)/eta];
end

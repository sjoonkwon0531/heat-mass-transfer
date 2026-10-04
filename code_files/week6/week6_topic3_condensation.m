% Week 6 - Topic 3: Nusselt Film Condensation on a Vertical Wall
% delta(x) = [4*k*mu*dT*x/(g*rhoL*(rhoL-rhov)*hfg')]^(1/4), h_x = k/delta,
% h_Nusselt = (4/3)*h_x(Lc) = 0.943*[k^3*g*hfg'*rhoL*(rhoL-rhov)/(mu*dT*Lc)]^(1/4)
% hfg' = hfg + (3/8)*cpL*dT. Cylinder 0.725; n-tube bank 0.725/n^(1/4).

function week6_topic3_condensation
    close all; clc
    g = 9.81; rhoL = 957.9; rhov = 0.596;
    muL = 2.79e-4; cpL = 4217; kL = 0.68; hfg = 2.257e6;

    hp    = @(dT) hfg + 0.375*cpL*dT;
    delta = @(x, dT) (4*kL*muL*dT.*x ./ (g*rhoL*(rhoL-rhov)*hp(dT))).^0.25;
    hx    = @(x, dT) kL ./ delta(x, dT);
    havgV = @(L, dT) 0.943*(kL^3*g*hp(dT)*rhoL*(rhoL-rhov)./(muL*dT.*L)).^0.25;
    havgC = @(D, dT, n) 0.725*(kL^3*g*hp(dT)*rhoL*(rhoL-rhov)./(n*muL*dT.*D)).^0.25;

    dT = 10; L = 0.5;
    fprintf('Steam at 1 atm, vertical wall, dT = %g K, L = %g m\n', dT, L);
    x = linspace(1e-3, L, 300);
    figure(1);
    yyaxis left;  plot(x, delta(x, dT)*1e6, 'LineWidth', 1.5); ylabel('\delta [\mum]');
    yyaxis right; plot(x, hx(x, dT), '--', 'LineWidth', 1.5); ylabel('h_x [W/m^2K]');
    xlabel('x [m]'); grid on; title('Film grows as x^{1/4}; h_x falls as x^{-1/4}');

    havg = havgV(L, dT);
    fprintf('  h_avg = %.0f W/m^2K; 4/3 rule: h_avg/h_x(L) = %.4f\n', ...
            havg, havg/hx(L, dT));
    Re = 4*havg*dT*L/hp(dT)/muL;
    fprintf('  film Reynolds Re_f = %.0f (laminar < 1800)\n', Re);

    fprintf('\nEffect of dT (L = 0.5 m):\n');
    for d = [5 10 20 40]
        fprintf('  dT = %3d K: h = %6.0f W/m^2K, q = %7.1f kW/m^2\n', ...
                d, havgV(L, d), havgV(L, d)*d/1e3);
    end
    fprintf('  -> h ~ dT^{-1/4} but q = h*dT ~ dT^{3/4}\n');

    fprintf('\nHorizontal tube banks (D = 25 mm):\n');
    ns = [1 2 4 9 16];
    for n = ns
        fprintf('  n = %2d: h = %6.0f W/m^2K\n', n, havgC(0.025, dT, n));
    end
    figure(2);
    plot(ns, havgC(0.025, dT, ns), 'o-', 'LineWidth', 1.5); grid on
    xlabel('number of tubes n'); ylabel('h_{avg} [W/m^2K]');
    title('Tube banks: h ~ n^{-1/4} (condensate loading)');
end

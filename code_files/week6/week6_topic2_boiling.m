% Week 6 - Topic 2: Boiling Heat Transfer - Rohsenow, CHF, Film Boiling
% Nucleate: q = mu_L*h_fg*sqrt(g*(rhoL-rhov)/sigma)*[cpL*dT/(Csf*h_fg*Pr^1.7)]^3
% CHF:      q_crit = 0.18*h_fg*rho_v*[g*sigma*(rhoL-rhov)/rho_v^2]^(1/4)
% Film:     h = 0.62*[k_v^3*g*(rhoL-rhov)*(h_fg+0.4*cpL*dT)/(D0*nu_v*dT)]^(1/4)

function week6_topic2_boiling
    close all; clc
    % saturated water / vapor at 1 atm
    g = 9.81; rhoL = 957.9; rhov = 0.596;
    muL = 2.79e-4; cpL = 4217; PrL = 1.76;
    hfg = 2.257e6; sigma = 0.0589;
    kv = 0.025; nuv = 2.0e-5;
    Csf = 0.013;      % water / platinum (or copper)

    qnb = @(dT) muL*hfg*sqrt(g*(rhoL-rhov)/sigma) .* ...
                (cpL*dT/(Csf*hfg*PrL^1.7)).^3;
    qc  = 0.18*hfg*rhov*(g*sigma*(rhoL-rhov)/rhov^2)^0.25;
    hfb = @(dT, D0) 0.62*(kv^3*g*(rhoL-rhov).*(hfg+0.4*cpL*dT) ./ ...
                          (D0*nuv*dT)).^0.25;

    fprintf('Rohsenow nucleate boiling (water/platinum, Csf = 0.013):\n');
    for dT = [5 10 15 20 25]
        fprintf('  dT = %3d K: q = %9.1f kW/m^2\n', dT, qnb(dT)/1e3);
    end
    fprintf('CHF: q_crit = %.2f MW/m^2, reached near dT ~ %.0f K\n', ...
            qc/1e6, (qc/qnb(1))^(1/3));

    % --- build the boiling curve (nucleate branch + film branch) ---
    dT1 = logspace(log10(3), log10((qc/qnb(1))^(1/3)), 100);  % nucleate up to CHF
    dT2 = logspace(log10(120), 3, 100);                       % film from Leidenfrost
    q1 = qnb(dT1);
    q2 = hfb(dT2, 0.01).*dT2;

    figure(1);
    loglog(dT1, q1, 'b-', 'LineWidth', 1.6); hold on
    loglog(dT2, q2, 'r-', 'LineWidth', 1.6);
    yline(qc, 'k--');
    xlabel('\DeltaT_e = T_w - T_{sat} [K]'); ylabel('q [W/m^2]');
    legend('nucleate (Rohsenow)', 'film boiling', 'CHF', 'Location', 'southeast');
    title('Boiling curve: nucleate branch, burn-out, film branch');
    grid on

    fprintf('\nFilm boiling around a 10 mm tube:\n');
    for dT = [200 500 1000]
        fprintf('  dT = %4d K: h = %7.1f W/m^2K, q = %8.1f kW/m^2\n', ...
                dT, hfb(dT, 0.01), hfb(dT, 0.01)*dT/1e3);
    end

    % radiation correction h = hr + hc*(hc/h)^(1/3)
    hc = hfb(500, 0.01); hr = 40; h = hc + hr;
    for it = 1:200
        hn = hr + hc*(hc/h)^(1/3);
        if abs(hn - h) < 1e-10, break; end
        h = hn;
    end
    fprintf('Radiation correction (dT = 500, h_r = 40): h_c = %.1f -> h = %.1f\n', hc, h);
end

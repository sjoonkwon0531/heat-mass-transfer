% Week 5 - Topic 3: Laminar-Turbulent Transition on a Flat Plate
% Re_crit = 5e5;  <Nu_lam> = 0.664*Pr^(1/3)*Re^(1/2)
% <Nu_turb> = 0.037*Re^0.8*Pr / (1 + 2.443*Re^(-0.1)*(Pr^(2/3)-1))
% blend: <Nu> = sqrt(<Nu_lam>^2 + <Nu_turb>^2)

function week5_topic3_turbulent_plate
    close all; clc
    Pr = 0.707;   % air
    Re = logspace(2, 7, 400);
    Nl = nulam(Re, Pr); Nt = nuturb(Re, Pr);
    Nc = sqrt(Nl.^2 + Nt.^2);

    figure(1);
    loglog(Re, Nl, 'b--', Re, Nt, 'r--', Re, Nc, 'k-', 'LineWidth', 1.5);
    hold on; xline(5e5, ':', 'Re_{crit}');
    grid on; xlabel('Re'); ylabel('\langle Nu \rangle');
    legend('laminar', 'turbulent', 'combined', 'Location', 'northwest');
    title('Flat-plate correlations, air (Pr = 0.707)');

    fprintf('  Re          Nu_lam     Nu_turb    combined\n');
    for R = [1e3 1e4 1e5 5e5 1e6 5e6 1e7]
        fprintf('  %9.1e  %9.1f  %9.1f  %9.1f\n', R, nulam(R,Pr), nuturb(R,Pr), ...
                sqrt(nulam(R,Pr)^2 + nuturb(R,Pr)^2));
    end

    % --- Worked example: wind over a roof panel ---
    nu_air = 15.9e-6; k_air = 0.0263; L = 2.0;
    fprintf('\nWind over an L = %g m panel:\n  U [m/s]   Re_L        <Nu>       h [W/m2K]\n', L);
    for U = [1 2 5 10 20]
        ReL = U*L/nu_air;
        Nu = sqrt(nulam(ReL,Pr)^2 + nuturb(ReL,Pr)^2);
        fprintf('  %6.1f  %10.3e  %9.1f  %9.2f\n', U, ReL, Nu, Nu*k_air/L);
    end
    fprintf('  -> past transition, h grows nearly like U^0.8.\n');
end

function N = nulam(Re, Pr)
    N = 0.664 * Pr^(1/3) .* sqrt(Re);
end

function N = nuturb(Re, Pr)
    N = 0.037 .* Re.^0.8 * Pr ./ (1 + 2.443 .* Re.^(-0.1) * (Pr^(2/3) - 1));
end

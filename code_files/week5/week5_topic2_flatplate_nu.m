% Week 5 - Topic 2: Laminar Flat-Plate Heat Transfer - the Nusselt Number
% Local: Nu_x = 0.332*Pr^(1/3)*sqrt(Re_x);  Mean: Nu_L = 0.664*Pr^(1/3)*sqrt(Re_L)
% Integral method (cubic profile): prefactor 0.36 (~8% above exact 0.332).

function week5_topic2_flatplate_nu
    close all; clc
    % --- Worked example: air over a heated plate ---
    nu_air = 15.9e-6; k_air = 0.0263; Pr_air = 0.707;
    U = 5; L = 0.5; W = 0.5; Ts = 60; Tinf = 20;
    ReL = U*L/nu_air;
    fprintf('Air, U = %g m/s, L = %g m: Re_L = %.3e < 5e5 -> laminar\n', U, L, ReL);

    x = linspace(0.005, L, 200);
    Rex = U*x/nu_air;
    Nux = 0.332*Pr_air^(1/3)*sqrt(Rex);
    hx = Nux*k_air./x;

    fprintf('\nLocal values (h_x ~ x^(-1/2)):\n  x [m]     Nu_x      h_x [W/m2K]\n');
    for xv = [0.01 0.05 0.1 0.2 0.35 0.5]
        Rev = U*xv/nu_air;
        Nuv = 0.332*Pr_air^(1/3)*sqrt(Rev);
        fprintf('  %5.2f  %8.2f  %10.2f\n', xv, Nuv, Nuv*k_air/xv);
    end

    NuL = 0.664*Pr_air^(1/3)*sqrt(ReL);
    hbar = NuL*k_air/L;
    fprintf('\nMean: Nu_L = %.1f, h_bar = %.2f W/m2K\n', NuL, hbar);
    fprintf('Total heat rate: Q = %.1f W\n', hbar*W*L*(Ts - Tinf));
    fprintf('Check: Nu_L / Nu_x(L) = %.3f (= 2 exactly)\n', ...
            NuL/(0.332*Pr_air^(1/3)*sqrt(ReL)));
    fprintf('Integral method vs exact: 0.36/0.332 = %.4f (~8%% high)\n', 0.36/0.332);

    figure(1);
    yyaxis left;  plot(x, hx, 'LineWidth', 1.5); ylabel('h_x [W/m^2K]');
    yyaxis right; plot(x, Nux, '--', 'LineWidth', 1.5); ylabel('Nu_x');
    xlabel('x [m]'); grid on; title('Local coefficient decays as x^{-1/2}');

    % --- Pr sweep at fixed Re_x ---
    Prs = [0.016 0.707 5.4 13 100];
    names = {'mercury','air','water(30C)','sea water','light oil'};
    fprintf('\nPr sweep at Re_x = 1e5:\n');
    for i = 1:numel(Prs)
        fprintf('  %-12s Pr = %7.3f  Nu_x = %8.1f\n', names{i}, Prs(i), ...
                0.332*Prs(i)^(1/3)*sqrt(1e5));
    end
    fprintf('  cf) Pr^(1/3) scaling holds for Pr >~ 0.6; liquid metals differ.\n');
end

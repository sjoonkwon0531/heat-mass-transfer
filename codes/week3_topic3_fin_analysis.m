% Week 3 - Topic 3: Extended Surfaces (Fins), Uniform Cross-Section, Steady State
% d^2(Theta)/dx^2 - m^2*Theta = 0, Theta = T - Tinf, m^2 = h*P/(k*Ac)
% BC cases: (1) Dirichlet-Dirichlet, (2) adiabatic tip, (3) Robin tip

function week3_topic3_fin_analysis
    close all; clc
    % Aluminum pin fin: D = 5 mm, L = 50 mm, k = 200 W/mK, h = 25 W/m^2K
    D = 0.005; L = 0.050; k = 200; h = 25; theta0 = 80;
    P = pi*D; Ac = pi*D^2/4;
    m = sqrt(h*P/(k*Ac));
    Qfin = sqrt(h*P*k*Ac) * theta0 * tanh(m*L);
    eta  = tanh(m*L) / (m*L);
    eps_ = Qfin / (h*Ac*theta0);
    fprintf('Pin fin: m = %.4f 1/m, mL = %.4f\n', m, m*L);
    fprintf('Q_fin = %.3f W, eta = %.4f, eps = %.2f\n', Qfin, eta, eps_);

    % Profiles for mL = 2
    mL = 2; Lf = 1; mm = mL/Lf;
    x = linspace(0, Lf, 101);
    r1 = thetaRatio(x, Lf, mm, 1, 0.2, 0.5);
    r2 = thetaRatio(x, Lf, mm, 2, 0.2, 0.5);
    r3 = thetaRatio(x, Lf, mm, 3, 0.2, 0.5);

    figure(1);
    plot(x, r1, 'b-', x, r2, 'r--', x, r3, 'g-.', 'LineWidth', 1.5);
    xlabel('x/L'); ylabel('\Theta/\Theta_0'); grid on;
    legend('Case 1: Dirichlet-Dirichlet', 'Case 2: adiabatic tip', ...
           'Case 3: Robin (convective) tip');
    title('Fin temperature profiles (mL = 2)');

    fprintf('Check: 1/cosh(mL) = %.6f, profile end = %.6f\n', ...
            1/cosh(mL), r2(end));
end

function r = thetaRatio(x, L, m, bcCase, thetaLratio, hOverMk)
    switch bcCase
        case 1
            c = thetaLratio;
            r = (c - exp(-m*L)) * (exp(m*x) - exp(-m*x)) / ...
                (exp(m*L) - exp(-m*L)) + exp(-m*x);
        case 2
            r = cosh(m*(L - x)) / cosh(m*L);
        case 3
            B = hOverMk;
            r = (cosh(m*(L - x)) + B*sinh(m*(L - x))) / ...
                (cosh(m*L) + B*sinh(m*L));
    end
end

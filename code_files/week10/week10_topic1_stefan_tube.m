% Week 10 - Topic 1: Stefan Tube (Arnold Cell), Log-Mean, Film Model, Pseudo-Steady D Measurement
% Lecture (Part 1):
%   * steady 1D diffusion of A through stagnant B (N_Bz = 0):
%       N_Az = -cD_AB/(1 - y_A) dy_A/dz = const
%       N_Az = cD_AB/(z2 - z1) ln[(1 - y_A2)/(1 - y_A1)] = cD_AB (y_A1 - y_A2)/((z2 - z1) y_B,lm)
%       y_B,lm = (y_B2 - y_B1)/ln(y_B2/y_B1)
%   * profile: (1 - y_A)/(1 - y_A1) = [(1 - y_A2)/(1 - y_A1)]^((z - z1)/(z2 - z1))
%   * film model: k_c = P D_AB/(delta p_B,lm)
%   * pseudo-steady Arnold cell (liquid level falls slowly):
%       rho_AL/M_A dz/dt = cD_AB (y_A1 - y_A2)/(z y_B,lm)
%       -> t = rho_AL y_B,lm (z^2 - z0^2)/(2 c D_AB M_A (y_A1 - y_A2))
%       -> D_AB from the slope of (z^2 - z0^2) versus t.
function week10_topic1_stefan_tube()
    % name: Antoine A, B, C (mmHg, degC), rho_L (kg/m^3), M (g/mol), Fuller volume
    Q.water   = [8.07131, 1730.63, 233.426, 997.0, 18.015, 12.7];
    Q.ethanol = [8.20417, 1642.89, 230.300, 789.0, 46.07, 2*16.5 + 6*1.98 + 5.48];
    Q.acetone = [7.02447, 1161.0, 224.0, 784.0, 58.08, 3*16.5 + 6*1.98 + 5.48];
    R = 8.314462618; P = 101325; TC = 25; T = TC + 273.15; c = P/(R*T); L = 0.10;
    psat = @(q, TC) 10.^(q(1) - q(2)./(q(3) + TC))*133.322;
    fuller = @(q, TK) 1.011e-3*TK^1.75*sqrt(1/q(5) + 1/28.97)/((q(6)^(1/3) + 20.1^(1/3))^2)*1e-4;
    ylm = @(y1, y2) ((1-y2) - (1-y1))/log((1-y2)/(1-y1));
    flux = @(D, y1, y2) c*D/L*log((1-y2)/(1-y1));
    prof = @(z, y1, y2) 1 - (1-y1)*((1-y2)/(1-y1)).^(z/L);

    fprintf('Stefan tube, L = %.0f cm, %.1f C, 1 atm, c = %.3f mol/m^3\n', L*100, TC, c);
    fprintf(' liquid    p_sat(kPa)  y_A1    D(cm^2/s)  y_B,lm   N_A (mol/m^2 s)  Stefan/Fick\n');
    names = {'water', 'ethanol', 'acetone'};
    for k = 1:3
        q = Q.(names{k}); y1 = psat(q, TC)/P; D = fuller(q, T); N = flux(D, y1, 0);
        fprintf(' %-8s %9.2f  %6.4f  %8.4f  %7.4f  %14.4e  %9.4f\n', names{k}, psat(q,TC)/1e3, y1, D*1e4, ylm(y1,0), N, N/(c*D*y1/L));
    end
    q = Q.acetone; y1 = psat(q, TC)/P; D = fuller(q, T);
    fprintf('\nlog form %.6e vs log-mean form %.6e\n', flux(D, y1, 0), c*D*y1/(L*ylm(y1, 0)));
    z = linspace(0, L, 1001); yB = 1 - prof(z, y1, 0);
    fprintf('path-averaged y_B = %.6f equals y_B,lm = %.6f\n', trapz(z, yB)/L, ylm(y1, 0));
    fprintf('film model (delta = 2 mm): k_c = P D/(delta p_B,lm) = %.3f cm/s\n', D/(2e-3*ylm(y1, 0))*100);

    % pseudo-steady Arnold cell: synthetic experiment and back-calculation of D
    q = Q.water; y1 = psat(q, TC)/P; Dt = fuller(q, T); z0 = 0.02; rhoL = q(4); MA = q(5)*1e-3;
    K = 2*c*Dt*MA*y1/(rhoL*ylm(y1, 0));
    rng(3); days = [1 2 4 6 8 10 14]; t = days*86400;
    zz = sqrt(z0^2 + K*t) + 2e-5*randn(size(t));
    slope = sum(t.*(zz.^2 - z0^2))/sum(t.^2);
    Dfit = slope*rhoL*ylm(y1, 0)/(2*c*MA*y1);
    fprintf('\nArnold cell (water, z0 = 2 cm): level after 14 days z = %.3f cm\n', zz(end)*100);
    fprintf('D_true = %.4f cm^2/s, D from (z^2 - z0^2) vs t fit = %.4f cm^2/s\n', Dt*1e4, Dfit*1e4);
end

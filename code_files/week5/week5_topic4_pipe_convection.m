% Week 5 - Topic 4: Forced Convection in a Pipe - Nusselt Correlations & LMTD
% Laminar (const T_w): <Nu> = (49.371 + (1.615*beta^(1/3) - 0.7)^3)^(1/3),
%   beta = Pe*D/L; limits 3.660 (const T_w) / 4.364 (const q_w)
% Turbulent (Gnielinski) and Q = h*A*LMTD.

function week5_topic4_pipe_convection
    close all; clc
    fprintf('Fully developed laminar limits (beta -> 0):\n');
    fprintf('  const wall T   : Nu -> %.3f (lecture: 3.660)\n', nulamT(1e-12));
    fprintf('  const wall flux: Nu -> %.3f (lecture: 4.364)\n', nulamQ(1e-12));

    beta = logspace(-1, 3, 300);
    figure(1);
    semilogx(beta, arrayfun(@nulamT, beta), 'b-', ...
             beta, arrayfun(@nulamQ, beta), 'r--', 'LineWidth', 1.5);
    yline(3.660, ':b'); yline(4.364, ':r'); grid on
    xlabel('\beta = Pe \cdot D/L'); ylabel('\langle Nu \rangle');
    legend('const T_w', 'const q_w', 'Location', 'northwest');
    title('Entrance effect: short pipes transfer better');

    % --- Worked example: hot-wall pipe heating water (laminar) ---
    rho = 997; cp = 4180; k = 0.61; nuw = 0.658e-6; Pr = 4.34;
    D = 0.02; L = 3; v = 0.05; Tw = 80; Tin = 20;

    Re = v*D/nuw; Pe = Re*Pr; b = Pe*D/L;
    Nu = nulamT(b); h = Nu*k/D;
    mdot = rho*v*pi*D^2/4; A = pi*D*L;
    Tout = Tw - (Tw - Tin)*exp(-h*A/(mdot*cp));
    dTin = Tw - Tin; dTout = Tw - Tout;
    LMTD = (dTin - dTout)/log(dTin/dTout);

    fprintf('\nWorked example: water, D = 2 cm, L = 3 m, v = 0.05 m/s, Tw = 80 C\n');
    fprintf('  Re = %.0f (laminar), Pe = %.0f, beta = %.1f\n', Re, Pe, b);
    fprintf('  Nu = %.2f, h = %.1f W/m2K, T_out = %.2f C\n', Nu, h, Tout);
    fprintf('  LMTD = %.2f K, Q = h*A*LMTD = %.1f W vs mdot*cp*dT = %.1f W\n', ...
            LMTD, h*A*LMTD, mdot*cp*(Tout - Tin));

    fprintf('\nSame pipe, higher speeds (Gnielinski):\n');
    for vv = [0.5 1 2]
        Re2 = vv*D/nuw;
        Nu2 = gniel(Re2, Pr, D/L);
        fprintf('  v = %4.1f m/s: Re = %6.0f, Nu = %7.1f, h = %6.0f W/m2K\n', ...
                vv, Re2, Nu2, Nu2*k/D);
    end
    fprintf('  -> laminar to turbulent: h jumps by an order of magnitude.\n');
end

function N = nulamT(b)
    N = (49.371 + (1.615*b^(1/3) - 0.7)^3)^(1/3);
end

function N = nulamQ(b)
    N = (83.326 + (1.953*b^(1/3) - 0.6)^3)^(1/3);
end

function N = gniel(Re, Pr, DoL)
    xi = (1.82*log10(Re) - 1.64)^(-2);
    N = (xi/8)*(Re - 1000)*Pr/(1 + 12.7*sqrt(xi/8)*(Pr^(2/3) - 1)) * (1 + DoL^(2/3));
end

% Week 9 - Topic 1: Gas Diffusivity (Kinetic Theory, Chapman-Enskog, Fuller)
% Chapman-Enskog (D in cm^2/s, T in K, P in atm, sigma in Angstrom):
%   D_AB = 1.858e-3 T^(3/2) sqrt(1/M_A + 1/M_B) / (P sigma_AB^2 Omega_D)
%   sigma_AB = (sigma_A + sigma_B)/2,  eps_AB = sqrt(eps_A eps_B),  Omega_D = f(kB T/eps_AB)
% Fuller: D_AB = 1.011e-3 T^1.75 sqrt(1/M_A + 1/M_B) / (P [(sum v_A)^(1/3) + (sum v_B)^(1/3)]^2)
% Kinetic theory: lambda = kB T/(sqrt(2) pi sigma^2 P), u = sqrt(8RT/(pi M)), D_AA* = lambda u/3
function week9_topic1_gas_diffusivity()
    % name: sigma (A), eps/kB (K), M (g/mol), Fuller volume
    G.H2  = [2.968, 33.3, 2.016, 7.07];   G.He  = [2.576, 10.2, 4.003, 2.88];
    G.N2  = [3.681, 91.5, 28.01, 17.9];   G.O2  = [3.433, 113.0, 32.00, 16.6];
    G.Air = [3.617, 97.0, 28.97, 20.1];   G.Ar  = [3.418, 124.0, 39.95, 16.1];
    G.CO2 = [3.996, 190.0, 44.01, 26.9];  G.CH4 = [3.822, 137.0, 16.04, 16.5 + 4*1.98];

    fprintf('Omega_D(1) = %.4f (table 1.439), Omega_D(10) = %.4f (table 0.7424)\n', omegaD(1), omegaD(10));
    T = 293.15;
    [D, om] = chapmanEnskog(G.CO2, G.Air, T, 1.0);
    fprintf('\nCO2-air %.2f K: Omega_D = %.4f, D_CE = %.4f, D_Fuller = %.4f cm^2/s\n', ...
        T, om, D, fuller(G.CO2, G.Air, T, 1.0));

    pairs = {'H2','N2'; 'O2','N2'; 'CO2','N2'; 'He','Ar'; 'CH4','Air'};
    fprintf('\nPair        T(K)   Chapman-Enskog   Fuller   (cm^2/s)\n');
    for k = 1:size(pairs, 1)
        for TT = [300, 600]
            A = G.(pairs{k,1}); B = G.(pairs{k,2});
            fprintf('%4s-%-5s %6.0f   %10.4f   %8.4f\n', pairs{k,1}, pairs{k,2}, TT, ...
                chapmanEnskog(A, B, TT, 1.0), fuller(A, B, TT, 1.0));
        end
    end

    % temperature scan for plotting
    Ts = linspace(250, 1000, 100);
    Dce = arrayfun(@(t) chapmanEnskog(G.O2, G.N2, t, 1.0), Ts);
    Dfu = arrayfun(@(t) fuller(G.O2, G.N2, t, 1.0), Ts);
    figure; loglog(Ts, Dce, 'LineWidth', 2); hold on; loglog(Ts, Dfu, '--', 'LineWidth', 2);
    xlabel('T (K)'); ylabel('D_{AB} (cm^2/s)'); legend('Chapman-Enskog', 'Fuller', 'Location', 'northwest');
    set(gca, 'FontName', 'Arial Narrow', 'FontSize', 14);

    kB = 1.380649e-23; R = 8.314462618; s = G.N2(1)*1e-10; Tn = 300;
    lam = kB*Tn/(sqrt(2)*pi*s^2*101325); u = sqrt(8*R*Tn/(pi*G.N2(3)*1e-3));
    fprintf('\nN2 300 K: lambda = %.1f nm, u = %.0f m/s, D_kin = %.3f cm^2/s\n', lam*1e9, u, lam*u/3*1e4);
end

function o = omegaD(ts)   % Neufeld-Janzen-Aziz (1972)
    o = 1.06036./ts.^0.15610 + 0.19300./exp(0.47635*ts) + 1.03587./exp(1.52996*ts) + 1.76474./exp(3.89411*ts);
end

function [D, om] = chapmanEnskog(A, B, T, P)
    sab = 0.5*(A(1) + B(1)); eab = sqrt(A(2)*B(2));
    om = omegaD(T/eab);
    D = 1.858e-3*T^1.5*sqrt(1/A(3) + 1/B(3))/(P*sab^2*om);
end

function D = fuller(A, B, T, P)
    D = 1.011e-3*T^1.75*sqrt(1/A(3) + 1/B(3))/(P*(A(4)^(1/3) + B(4)^(1/3))^2);
end

% Week 9 - Topic 2: Liquid, Pore (Knudsen) and Solid Diffusivity
%   Stokes-Einstein: D = kB T/(6 pi r mu)
%   Wilke-Chang:     D_AB = 7.4e-8 sqrt(Phi_B M_B) T/(mu_B V_A^0.6)   [cm^2/s, cP, cm^3/mol]
%   Knudsen:         D_KA = 4850 d sqrt(T/M)   [d in cm -> cm^2/s]
%   Transition:      1/D_Ae = (1 - alpha y_A)/D_AB + 1/D_KA;  porous solid: D'_Ae = eps^2 D_Ae
%   Solids:          D = D0 exp(-Q/RT)  (lecture table)
kB = 1.380649e-23; R = 8.314462618;
wilkeChang = @(T, mu, MB, VA, phi) 7.4e-8*sqrt(phi*MB)*T./(mu*VA.^0.6);
knudsen    = @(dcm, T, M) 4850*dcm.*sqrt(T./M);
effective  = @(DAB, DK, alpha, yA) 1./((1 - alpha.*yA)./DAB + 1./DK);
arrhenius  = @(D0, Q, T) D0*1e-6*exp(-Q*1e3./(R*T));

T = 298.15; mu = 0.890;
fprintf('Wilke-Chang, O2 in water at 25 C: D = %.3e cm^2/s\n', wilkeChang(T, mu, 18.02, 25.6, 2.26));
fprintf('Stokes-Einstein, 10 nm particle: D = %.3e m^2/s\n', kB*T/(6*pi*5e-9*mu*1e-3));

d_nm = logspace(0, 4, 200); DAB = 0.20;
DK = knudsen(d_nm*1e-7, 300, 28); De = effective(DAB, DK, 0, 0);
figure; loglog(d_nm, DK, '--', d_nm, De, '-', d_nm, DAB*ones(size(d_nm)), ':', 'LineWidth', 2);
xlabel('pore diameter (nm)'); ylabel('D (cm^2/s)'); legend('D_K', 'D_{Ae}', 'D_{AB}', 'Location', 'southeast');
set(gca, 'FontName', 'Arial Narrow', 'FontSize', 14);
for d = [1 10 50 100 1000 10000]
    dk = knudsen(d*1e-7, 300, 28);
    fprintf('  d = %6d nm: D_K = %.4e, D_Ae = %.4e cm^2/s\n', d, dk, effective(DAB, dk, 0, 0));
end

names = {'Au self (fcc)', 'Cu self (fcc)', 'Ni self (fcc)', 'Fe(gamma) self', 'Fe(alpha) self', ...
         'C in Fe (bcc)', 'N in Fe (bcc)', 'H in Fe (bcc)', 'C in Fe (fcc)'};
D0 = [10.7 31 190 49 200 2.0 0.3 0.1 2.5];        % mm^2/s
Q  = [176.9 200.3 279.7 284.1 239.7 84.1 76.1 13.4 144.2];   % kJ/mol
fprintf('\nSolid-state diffusivity at 1000 K\n');
for k = 1:numel(D0)
    D = arrhenius(D0(k), Q(k), 1000);
    fprintf('  %-16s D = %.3e m^2/s, sqrt(D*1h) = %9.3f um\n', names{k}, D, sqrt(D*3600)*1e6);
end

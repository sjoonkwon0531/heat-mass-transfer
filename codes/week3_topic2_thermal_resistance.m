% Week 3 - Topic 2: Combined Conduction + Convection via Thermal Resistance Networks
% Q = dT / sum(R_i); R_conv = 1/(h*A); R_slab = L/(k*A); R_cyl = log(ro/ri)/(2*pi*L*k)

function week3_topic2_thermal_resistance
    clc
    % --- Case A: 3-layer plane wall with two-sided convection ---
    Th = 300; Tc = 20; A = 1;
    hL = 25; hR = 10;
    Lw = [0.02 0.10 0.01];      % layer thicknesses [m]
    kw = [15   0.5  45  ];      % conductivities [W/mK]

    R = [1/(hL*A), Lw./(kw*A), 1/(hR*A)];
    Rtot = sum(R);
    Q = (Th - Tc) / Rtot;
    U = 1 / (A * Rtot);

    names = {'conv,L','cond,1','cond,2','cond,3','conv,R'};
    fprintf('Case A: 3-layer plane wall with two-sided convection\n');
    for i = 1:numel(R)
        fprintf('  R_%-7s = %10.6f K/W\n', names{i}, R(i));
    end
    fprintf('  R_total   = %10.6f K/W\n  Q = %.3f W,  U = %.4f W/m^2K\n', Rtot, Q, U);

    T = Th - cumsum(Q * R);          % temperatures after each resistance
    fprintf('  T profile: %s\n', sprintf('%.2f, ', [Th T]));

    % --- Case B: insulated steam pipe, per meter ---
    Lp = 1; h_in = 1500; h_out = 12;
    r = [0.025 0.030 0.055];        % r_i, r_1, r_o [m]
    ks = [50 0.06];                  % steel, insulation [W/mK]
    A_in = 2*pi*r(1)*Lp; A_out = 2*pi*r(end)*Lp;
    R2 = [1/(h_in*A_in), ...
          log(r(2)/r(1))/(2*pi*Lp*ks(1)), ...
          log(r(3)/r(2))/(2*pi*Lp*ks(2)), ...
          1/(h_out*A_out)];
    Q2 = (250 - 25) / sum(R2);

    lab = {'conv,in','cond,steel','cond,insul','conv,out'};
    fprintf('\nCase B: insulated steam pipe, per meter of pipe\n');
    for i = 1:4
        fprintf('  R_%-10s = %10.6f K/W\n', lab{i}, R2(i));
    end
    fprintf('  Q per meter = %.2f W/m\n', Q2);
end

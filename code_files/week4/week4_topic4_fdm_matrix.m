% Week 4 - Topic 4: Explicit FDM in Matrix Form - U_{n+1} = D*U_n + delt*q_n
% Faithful extension of the lecture MATLAB demo:
%   dU/dtau = d^2U/dr^2 + q(r,tau), U(0)=U(1)=0, U(r,0)=0
%   delx = 0.01, delt = delx^2/4 (s = 1/4 <= 1/2: stable),
%   q = 100 on 0.45 <= r <= 0.55, tau <= 0.1, T0 = 25 degC
%   -> U_max = 1.7786, T_max = T0*U_max = 44.46 degC (lecture value)

function week4_topic4_fdm_matrix
    close all; clc
    %%% discretization
    delx = 0.01; delt = (delx^2)/4;     % Neumann (stability) condition: s = 1/4
    xvec = 0:delx:1; m = length(xvec) - 1;
    tvec = 0:delt:0.1; n = length(tvec) - 1;

    %%% initial temperature
    T0 = 25;                             % [=] deg C

    %%% profile for heat generation inside
    qvec = zeros(length(xvec), 1);
    sidx = min(find(xvec >= 0.45));      %#ok<MXFND>
    fidx = max(find(xvec <= 0.55));      %#ok<MXFND>
    qvec(sidx:fidx) = 100;               % uniform heat generation

    %%% update matrix D (tridiagonal, lecture form)
    s = delt/delx^2;
    Dmat = zeros(m+1, m+1);
    for i = 2:m
        Dmat(i,i)   = 1 - 2*s;
        Dmat(i,i+1) = s;
        Dmat(i,i-1) = s;
    end
    Dmat(1,1) = 1 - 2*s;  Dmat(m+1,m+1) = 1 - 2*s;
    Dmat(1,2) = s;  Dmat(2,1) = s;  Dmat(m,m+1) = s;  Dmat(m+1,m) = s;

    %%% march: U_{n+1} = D*U_n + delt*q_n
    Umat = zeros(n+1, m+1);
    Uvecold = Umat(1,:)';
    for k = 1:n
        % time-independent source (set eta > 0 for a decaying source q*exp(-eta*tau))
        eta = 0;
        qvecold = qvec * exp(-eta * tvec(k));
        Uvecnew = (Dmat * Uvecold) + (delt * qvecold);
        Umat(k+1,:) = Uvecnew';
        Uvecold = Uvecnew;
    end

    Umax = max(max(Umat));  Tmax = Umax * T0;
    fprintf('U_max = %.4f  ->  T_max = T0*U_max = %.2f degC (lecture: 44.46)\n', Umax, Tmax);

    figure(1);
    imagesc(xvec, tvec, Umat); colorbar;
    xlabel('Dimensionless space'); ylabel('Dimensionless time');
    title('Dimensionless temperature distribution');

    figure(2); hold on
    for tau = [0.01 0.03 0.05 0.1]
        [~, k] = min(abs(tvec - tau));
        plot(xvec, Umat(k,:), 'LineWidth', 1.4);
    end
    grid on; xlabel('r'); ylabel('U');
    legend('\tau=0.01','\tau=0.03','\tau=0.05','\tau=0.1','Location','northeast');
    title('Profiles: source band spreads by diffusion');

    %%% stability check: s > 1/2 diverges
    fprintf('\nStability (s = delt/delx^2):\n');
    for s2 = [0.25 0.5 0.51]
        U = runquick(0.02, s2, 0.1);
        fprintf('  s = %.2f -> max|U| = %.3e (%s)\n', s2, max(abs(U)), ...
                ternary(max(abs(U)) < 10, 'stable', 'UNSTABLE'));
    end
end

function U = runquick(delx, s, tauEnd)
    delt = s*delx^2;
    xv = 0:delx:1; m = length(xv) - 1;
    q = zeros(m+1,1); q(xv >= 0.45 & xv <= 0.55) = 100;
    U = zeros(m+1,1);
    for k = 1:round(tauEnd/delt)
        Un = U;
        for i = 1:m+1
            left = 0; right = 0;
            if i > 1,   left  = U(i-1); end
            if i < m+1, right = U(i+1); end
            Un(i) = (1 - 2*s)*U(i) + s*(left + right) + delt*q(i);
        end
        U = Un;
    end
end

function out = ternary(cond, a, b)
    if cond, out = a; else, out = b; end
end

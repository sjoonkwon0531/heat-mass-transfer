% Week 6 - Topic 1: Generalized Fourier Series & the Finite Fourier Transform
% Dirichlet-Dirichlet basis Phi_n = sqrt(2)*sin(n*pi*x); linear PDE -> one ODE
% per mode. Demos: Gibbs overshoot for f = 1; transient membrane (steady at
% t ~ 0.3); 2D strip solution heat map.

function week6_topic1_fft_series
    close all; clc
    % --- Gibbs phenomenon for f(x) = 1 ---
    x = linspace(0, 1, 4001);
    figure(1); hold on
    for N = [3 9 29 99]
        plot(x, sineseries1(x, N), 'LineWidth', 1.1);
    end
    yline(1, 'k--'); grid on
    xlabel('x'); ylabel('partial sum'); ylim([0 1.3]);
    legend('N=3','N=9','N=29','N=99','f = 1','Location','south');
    title('Fourier-sine series of f = 1: Gibbs overshoot ~ 1.179');
    for N = [9 49 199]
        fprintf('N = %4d: max of partial sum = %.4f (Gibbs ~1.179)\n', ...
                N, max(sineseries1(x, N)));
    end

    % --- transient membrane ---
    fprintf('\nTransient membrane, Theta(0.5, t) vs steady 0.5:\n');
    figure(2); hold on
    for t = [0.01 0.05 0.1 0.3]
        plot(x, membrane(x, t), 'LineWidth', 1.3);
        fprintf('  t = %4.2f: Theta(0.5) = %.4f, exp(-pi^2 t) = %.4f\n', ...
                t, membrane(0.5, t), exp(-pi^2*t));
    end
    plot(x, 1 - x, 'k--', 'LineWidth', 1.2);
    grid on; xlabel('x'); ylabel('\Theta');
    legend('t=0.01','t=0.05','t=0.1','t=0.3','steady 1-x');
    title('Membrane approaches steady state at t \sim 0.3 L^2/D');

    % --- 2D strip heat map ---
    [X, Y] = meshgrid(linspace(0,1,101), linspace(0,1,101));
    T = zeros(size(X));
    for k = 0:150
        n = 2*k + 1;
        T = T + 4/pi * exp(-n*pi*Y) .* sin(n*pi*X) / n;
    end
    figure(3);
    imagesc(X(1,:), Y(:,1), T); axis xy; colorbar; colormap('hot');
    xlabel('x'); ylabel('y'); title('2D strip: T_1 at y = 0, 0 at the sides');
    fprintf('\n2D strip: T(0.5, 0.25) = %.6f, T(0.5, 0.5) = %.6f\n', ...
            T(26, 51), T(51, 51));
end

function s = sineseries1(x, N)
    s = zeros(size(x));
    for n = 1:N
        s = s + 2*(1 - (-1)^n)/(n*pi) * sin(n*pi*x);
    end
end

function s = membrane(x, t)
    s = 1 - x;
    for n = 1:199
        s = s - 2*exp(-(n*pi)^2*t) * sin(n*pi*x)/(n*pi);
    end
end

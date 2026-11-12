package hcl.smart.ticket.config;

import java.time.Duration;
import java.util.concurrent.Executor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.client.RestClient;

@Configuration
public class AiAnalysisConfiguration {

	@Bean
	RestClient.Builder aiAnalysisRestClientBuilder() {
		return RestClient.builder();
	}

	@Bean(name = "aiAnalysisExecutor")
	Executor aiAnalysisExecutor() {
		ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
		executor.setCorePoolSize(2);
		executor.setMaxPoolSize(4);
		executor.setQueueCapacity(8);
		executor.setThreadNamePrefix("ai-analysis-");
		executor.setWaitForTasksToCompleteOnShutdown(false);
		executor.initialize();
		return executor;
	}

	@Bean(name = "aiAnalysisRequestTimeout")
	Duration aiAnalysisRequestTimeout(
			@Value("${smartresolve.ai.request-timeout:PT20S}") Duration timeout) {
		if (timeout.isZero() || timeout.isNegative()) {
			throw new IllegalArgumentException("AI request timeout must be positive");
		}
		return timeout;
	}
}

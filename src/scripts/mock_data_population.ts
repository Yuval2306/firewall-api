import { faker } from '@faker-js/faker';
import database from '../config/database';
import { PostgresService } from '../services/PostgresService';
import logger from '../config/logger';

interface MockRule {
  type: 'ip' | 'url' | 'port';
  value: string;
  mode: 'blacklist' | 'whitelist';
}

class MockDataGenerator {
  private generateValidIP(): string {
    return faker.internet.ipv4();
  }

  private generateValidURL(): string {
    return faker.internet.domainName();
  }

  private generateValidPort(): string {
    const commonPorts = [22, 80, 443, 21, 25, 53, 110, 993, 995, 3389];
    const randomPorts = Array.from({ length: 20 }, () => 
      faker.number.int({ min: 1024, max: 65535 })
    );
    
    const allPorts = [...commonPorts, ...randomPorts];
    return faker.helpers.arrayElement(allPorts).toString();
  }

  private generateEdgeCaseIPs(): string[] {
    return [
      '0.0.0.0',        // Network address
      '127.0.0.1',      // Localhost
      '255.255.255.255', // Broadcast
      '192.168.1.1',    // Private network
      '10.0.0.1',       // Private network
      '172.16.0.1'      // Private network
    ];
  }

  private generateEdgeCasePorts(): string[] {
    return [
      '1',      // Minimum port
      '22',     // SSH
      '80',     // HTTP
      '443',    // HTTPS
      '8080',   // Alternative HTTP
      '65535'   // Maximum port
    ];
  }

  private generateEdgeCaseURLs(): string[] {
    return [
      'localhost',
      'example.com',
      'test-domain.org',
      'sub.domain.co.uk',
      'very-long-domain-name-that-is-still-valid.com',
      'xn--nxasmq6b.xn--j6w193g' 
    ];
  }

  public generateMockData(): MockRule[] {
    const mockData: MockRule[] = [];
    const modes: ('blacklist' | 'whitelist')[] = ['blacklist', 'whitelist'];

    // Generate IPs
    for (let i = 0; i < 8; i++) {
      mockData.push({
        type: 'ip',
        value: this.generateValidIP(),
        mode: faker.helpers.arrayElement(modes)
      });
    }

    this.generateEdgeCaseIPs().slice(0, 2).forEach(ip => {
      mockData.push({
        type: 'ip',
        value: ip,
        mode: faker.helpers.arrayElement(modes)
      });
    });

    for (let i = 0; i < 8; i++) {
      mockData.push({
        type: 'url',
        value: this.generateValidURL(),
        mode: faker.helpers.arrayElement(modes)
      });
    }

    this.generateEdgeCaseURLs().slice(0, 2).forEach(url => {
      mockData.push({
        type: 'url',
        value: url,
        mode: faker.helpers.arrayElement(modes)
      });
    });

    for (let i = 0; i < 8; i++) {
      mockData.push({
        type: 'port',
        value: this.generateValidPort(),
        mode: faker.helpers.arrayElement(modes)
      });
    }

    this.generateEdgeCasePorts().slice(0, 2).forEach(port => {
      mockData.push({
        type: 'port',
        value: port,
        mode: faker.helpers.arrayElement(modes)
      });
    });

    return mockData;
  }

  public async populateDatabase(): Promise<void> {
    try {
      logger.info('Starting mock data population...');
      
      await database.connect();
      
      // Generate mock data
      const mockData = this.generateMockData();
      
      logger.info(`Generated ${mockData.length} mock rules`);
      
      // Insert data
      for (const rule of mockData) {
        try {
          await PostgresService.createRule(rule);
        } catch (error) {
          logger.warn(`Skipped duplicate rule: ${rule.type} ${rule.value} (${rule.mode})`);
        }
      }
      
      logger.info('Mock data population completed successfully');
      
    } catch (error) {
      logger.error('Error populating mock data:', error);
      throw error;
    } finally {
      await database.disconnect();
    }
  }
}

if (require.main === module) {
  const generator = new MockDataGenerator();
  generator.populateDatabase()
    .then(() => {
      logger.info('Mock data script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Mock data script failed:', error);
      process.exit(1);
    });
}

export default MockDataGenerator;
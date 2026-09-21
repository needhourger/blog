---
title: AI时代的爬虫技术
published: 2025-12-19T13:55:16+08:00
tags: [爬虫]
category: CODE
draft: false
---

## Zero - 爬虫历史

网络爬虫技术这一项可以说是颇具历史的计算机技术, 从最开始的简单索引工具, 到后来的搜索引擎基础之一, 再到现如今的大模型 (LLM) AI 时代已经历了许许多多的变化. 从曾经大受欢迎的 Scrapy, PySpider 这类的分布式爬虫框架到现在最新 AI 大模型技术的引入, 都让爬虫技术有了不同的发展.

现如今的 AI 时代, 爬虫技术已经成为了为大模型 LLM 赋能的重要工具之一. 现在的爬虫技术不单单是支持分布式等, 同时还支持完全由 AI 驱动的爬取技术用以对抗日益道高一尺魔高一丈的反爬技术. 可以说现如今的爬虫技术已经主要分为了两派:

- 传统爬虫但是输出内容 AI 友好化, 这是众多 RAG 引擎等为了给 LLM 提供更加丰富的上下文而青睐的技术之一.
- 由 AI 大模型驱动的网络爬虫技术, 乃至多模态网络爬虫. 为了应付日益复杂的反爬机制, 2FA 机制以及动态刷新机制而诞生的新型爬虫技术.

当然其实在本文中后者并不在这次的讨论范围内, 本文主要讨论的是为 RAG 引擎所使用输出内容大模型 AI 友好的爬虫框架. 本文将采取目前比较火的两个常用 AI 友好型爬虫框架做横向对比:

- [Crawl4AI](https://github.com/unclecode/crawl4ai)
- [Firecrawl](http://github.com/firecrawl/firecrawl)

## First - Crawl4AI vs Firecrawl

### Crawl4AI

Github 上拥有 50k+ star 的项目,是目前较为流行的 AI 友好形爬虫框架之一. 优势是对于 HTML 转 markdown 等 AI 友好型内容有较高的语义化能力, 适用于 RAG, 代理以及数据通道等应用. 官方宣称其具有一下优势

- Markdown 生成

  - 能生成格式准确结构清洗的 Markdown 文档. 同时基于启发式过滤, 能去除噪声以及无关的部分以方便 AI 友好处理.
  - 会将页面链接转换为具备清洗引文和编号的参考文献列表.
  - 用户可以自定义 Markdown 生成策略, 以满足特定的需求.
  - 使用 BM25 的过滤方法来提取核心信息内容并去除无关内容.

- 针对结构化数据:

  - 只是使用 LLM 作为结构化数据提取, 包括但不限于开源模型亦或者是专有模型
  - 试试分块策略 (基于主题, 正则表达式, 句子级别) 以针对性的处理内容
  - 根据用户查询依据余弦相似度算法查找特定内容块, 以进行语义提取
  - 同时支持传统 XPath 以及 css 快速提取数据
  - 支持自定义模式, 从重复的格式中提取格式化 JSON

- 浏览器集成:

  - 可使用用户浏览器, 完全控制以避免被反爬检测
  - 可远程控制浏览器, 使用 Chrome 开发者工具协议进行远程, 大规模数据提取
  - 支持创建和使用已保存的身份状态信息, cookie 以及设置的持久化文件
  - 支持保存浏览器状态以用于多步骤爬取
  - 只是无缝连接使用身份验证的代理服务器
  - 可自定义浏览器 Header, cookie, 用户代理等实现定制化爬虫设置
  - 多浏览器支持兼容 Chromium, firefox 以及 Webkit
  - 支持动态调整浏览器视窗大小以匹配页面内容, 确保所有元素完整渲染并捕获

- 爬取策略:

  - 支持多媒体内容提取, 诸如图像, 音频, 视频以及响应图像格式
  - 支持动态爬取, 执行 JS 并等待异步或同步响应内容
  - 支持在爬取过程中捕获屏幕截图以便于调试分析
  - 支持直接处理原始 HTML 或者本地文件 HTML
  - 支持提取内部连接, 外部链接以及嵌入的 iframe 内容
  - 支持自定义钩子以实现自定义的爬取行为 (支持基于字符串和函数的 API)
  - 缓存数据以提高速度同时避免重复抓取
  - 支持从页面中检索结构化元数据
  - 支持直接提取 iframe 内容
  - 支持处理延迟加载模式, 确保不会因延迟加载而丢失任何内容
  - 可模拟滚动加载和捕获所有动态内容

- 部署模式:

  - 支持 docker 部署, 具备 FastAPI 服务器
  - 内置 JWT 令牌认证, 确保 API 安全
  - 一键部署支持基于 API 的工作流程和安全令牌认证
  - 为大规模生产设计, 优化服务器性能
  - 支持云部署, 适配主流云平台的即用型配置

- 其他功能:
  - 模拟真实用户行为避免反爬检测
  - 基于标签的内容提取, 元数据抓取优化
  - 提取并分析所有连接, 以进行详细的数据探索
  - 支持基于文件系统的缓存以及跨域请求

### Crawl4AI 安装

1. 使用 pip 安装

```shell
pip install crawl4ai
crawl4ai-setup
```

默认安装 Crawl4AI 异步版本, 使用 `Playwright` 进行爬取.

1. 使用 Docker 安装

docker 版本支持一些额外的特性:

- 实时监控仪表盘
- 利用浏览器池和页面预热技术实现快速响应
- 用于测试和生成请求代码的交互式环境
- MCP 集成
- 更加全面的 API 接口支持, 包括 HTML 提取, 屏幕截图, PDF 生成以及 Javascript 执行.
- 支持多架构自动检测 (AMD64/ARM64)
- 优化资源, 改进内存管理

```shell
docker pull unclecode/crawl4ai:latest
docker run -d -p 11235:11235 --name crawl4ai --shm-size=1g unclecode/crawl4ai:latest
```

### Firecrawl

Firecrawl 则是在 Github 上收获了 70k+ star. 哪怕其目前仍在开发过程中并且尚未实现自托管部署, 仅支持本地运行~~那还蛮怪的这样还有 70k+ star~~

其目前具备如下特性:

- 抓取 URL 并以 LLM 优化的格式输出: Markdown, 通过 LLM 提取的结构化数据, 屏幕截图, html
- 抓取所有的 URL 并以 LLM 友好的格式返回
- 输入网站地址即可自动获取所有相关网页 URL
- 支持检索网站以获取完整内容
- 支持代理, 反反爬机制, 动态内容渲染, 输出解析和编排
- 可自定义排除标签, 使用自定义的 Header 绕过身份验证, 并支持最大深度爬取
- 支持多媒体内容解析: pdf, docx, 图像等
- 可靠性至上
- 支持点击, 滚动, 输入, 等待操作完成后再提取数据
- 支持批量处理, 异步同时抓取数千个 URL
- 支持监控并检测网站内容变化并试试更新

### Firecrawl 使用

较为繁琐的启动方式这里直接跳过,选用最方便的 docker compose 部署运行本地环境.

1. 首先复制默认的环境变量模板到项目根目录

```shell
cp app/api/.env.example .env
docker compose build
docker compose up
```

1. 接下来修改 .env 文件内容, 关闭

## Second - 测试

这里将采用[某旅游网站的 FAQ 页面](https://www.sentosa.com.sg/en/faqs)来作为例子测试二者爬取效果. 其中包含表格以及外链等.

### Firecrawl 爬取

1. 使用如下 curl 命令请求本地启动的 Firecrawl 服务启动一个爬取任务:

```shell
curl -X POST http://localhost:3002/v2/crawl \
    -H 'Content-Type: application/json' \
    -d '{
      "url": "https://www.sentosa.com.sg/en/faqs",
      "limit": 10,
      "scrapeOptions": {
        "formats": ["markdown", "html"]
      }
    }'
```

在返回内容内会得到任务 id

```json
{
  "success": true,
  "id": "019b35a9-a287-76bb-b9b8-d9a4ebb9c1dc",
  "url": "http://localhost:3002/v2/crawl/019b35a9-a287-76bb-b9b8-d9a4ebb9c1dc"
}
```

1. 使用如下 curl 命令获取爬取任务状态:

```shell
curl -X GET http://localhost:3002/v2/crawl/019b35a9-a287-76bb-b9b8-d9a4ebb9c1dc \
  -H 'Content-Type: application/json' \
```

```json
{
  "success": true,
  "status": "completed",
  "completed": 0,
  "total": 0,
  "creditsUsed": -1,
  "expiresAt": "2025-12-20T08:14:22.000Z",
  "data": [],
  "warning": "Only 0 result(s) found. For broader coverage, try crawling with crawlEntireDomain=true or start from a higher-level path like sentosa.com.sg"
}
```

### Firecrawl Markdown 结果

```markdown
ACCESSIBILITY

SEARCHauto-suggest-input

0

CART

---

Your cart is empty!

Start shopping for tickets, tours, deals and more fun.

[Shop now](https://www.sentosa.com.sg/en/shop/)

- Things to do

[Attractions](https://www.sentosa.com.sg/en/things-to-do/attractions/)

[Dining](https://www.sentosa.com.sg/en/things-to-do/dining/)

[Events & Tours](https://www.sentosa.com.sg/en/things-to-do/events/)

[Spas & Wellness](https://www.sentosa.com.sg/en/things-to-do/spas-and-wellness/)

[Shops & Services](https://www.sentosa.com.sg/en/things-to-do/shops-and-services/)

[Explorers of Sentosa by Thomas Dambo](https://www.sentosa.com.sg/en/things-to-do/explorers-of-sentosa/)

- [Places to stay](https://www.sentosa.com.sg/en/places-to-stay/)
- Plan your event

[Event Venues](https://www.sentosa.com.sg/en/plan-your-event/event-venues/)

[Meetings, Incentives, Conventions & Exhibitions in Sentosa](https://www.sentosa.com.sg/en/plan-your-event/mice/)

[Weddings & Solemnisations](https://www.sentosa.com.sg/en/plan-your-event/weddings/)

- Deals

[Promos](https://www.sentosa.com.sg/en/deals/promos/)

[Sentosa Discovery Pass](https://www.sentosa.com.sg/en/deals/discovery-pass/)

[Mastercard Promotions](https://www.sentosa.com.sg/en/deals/mastercard/)

- Get inspired

[Sentosa Guides](https://www.sentosa.com.sg/en/get-inspired/sentosa-guides/)

[Discovering Sustainable Sentosa](https://www.sentosa.com.sg/en/get-inspired/sustainable-sentosa/)

[Learning Journey Programmes for Schools](https://www.sentosa.com.sg/en/get-inspired/learn-with-us/)

[Rediscover Sentosa's Rich Heritage & History](https://www.sentosa.com.sg/en/get-inspired/rediscover-sentosa-rich-heritage-and-history/)

[Island Map & Sentosa Discovery Guide](https://www.sentosa.com.sg/en/get-inspired/sentosa-discovery-guide/)

[Explore the Natural Wonders of Sentosa](https://www.sentosa.com.sg/en/get-inspired/sentosa-rich-natural-biodiversity/)

- [Shop](https://www.sentosa.com.sg/en/shop/)
- Membership

[Islander](https://www.sentosa.com.sg/en/membership/islander/)

[Islander Deals](https://www.sentosa.com.sg/en/membership/islanderdeals/)

[![Sentosa, where discovery never ends](https://www.sentosa.com.sg/-/media/sentosa/features/header/sentosa-logo_where-discovery-never-ends.png?revision=cb4c816d-d61a-4139-bf8c-03f735089572&w=178)](https://www.sentosa.com.sg/en/)

![question](https://www.sentosa.com.sg/-/media/sentosa/icons/question_icon.svg?revision=d67c517a-754a-45ef-a0ff-a6e1af9b8a66)

# Frequently asked questions

## Find answers about Islander membership, attractions, hotels, restaurants and more. Need more help? [Contact us](https://www.sentosa.com.sg/en/contact-us/)

Visit Sentosa

Islander Membership

Sentosa Admission Fees

How much is the island admission fee?

The fees that apply from 1 April 2023 are as follows:

**1. Sentosa Express via VivoCity Station**

|                                                                                                  |                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|                                                                                                  | **Fees per guest**                                                                                                                                                                |
| Standard fee                                                                                     | $4                                                                                                                                                                                |
| Selected TransitLink concession card holders                                                     | $2<br>_Senior citizens, persons with disabilities, workfare transport concession card holders and for primary, secondary, junior college and ITE student concession card holders_ |
| Free<br>_Child concession card holders, or children below 0.9m tall and accompanied by an adult_ |

**2\. Cars and Taxis driving in via all gantries at the Sentosa Gateway**

|                  |                      |     |
| ---------------- | -------------------- | --- |
| **Day / Time**   | **Fees per vehicle** |
| Daily            | 7am - 11.29am        | $6  |
| 11.30am - 1.30pm | $2                   |
| 1.31pm - 5pm     | $6                   |
| 5.01pm - 6.59am  | $2                   |

Island admission fees (where applicable) will be automatically deducted via the CashCard inserted in your in-vehicle unit (I.U.) when you drive through the gantry auto-lanes.

**3. Goods & Services Vehicles driving in via all gantries at the Sentosa Gateway**

|                                     |                      |
| ----------------------------------- | -------------------- |
| **Day / Time**                      | **Fees per vehicle** |
| Mon – Fri (8am - 6pm) _\*except PH_ | Free                 |
| Fri – Mon (6.01pm - 7.59am)         | $10                  |
| Public Holidays                     | $10                  |

Island admission fees (where applicable) will be automatically deducted via the CashCard inserted in your in-vehicle unit (I.U.) when you drive through the gantry auto-lanes.

If you have a valid delivery or purchase order, you must enter via gantry Lane 1 or 2 (far left) at the Sentosa Gateway. Our staff at the gantry lane will verify the documents prior to giving a waiver of the island admission fee.

**4\. Private Coaches driving in via all gantries at the Sentosa Gateway**

|                                                                    |                      |
| ------------------------------------------------------------------ | -------------------- |
| **Day / Time**                                                     | **Fees per vehicle** |
| Daily<br>Minibus with seating capacity of 30 passengers or fewer.  | $20 per minibus      |
| Daily<br>Coach with a seating capacity of more than 30 passengers. | $40 per coach        |

This flat fee charge applies only to minibuses and coaches that arrive unannounced at the gantry without prior arrangements. Coaches with pre-existing arrangements such as those for corporate events, staff transportation, Sentosa Cove residents, community groups or eligible schools, will remain unaffected. Payment can be auto deducted via the CashCard inserted in your I.U. or via cash paid to our counters at the gantry.

How will the applicable island admission fee be charged?

Island admission fees will be charged as follows:

1. Guests driving into the island via the Sentosa Gateway:

- Island admission fees (where applicable) will be automatically deducted via the CashCard inserted in your in-vehicle/on-board unit (IU/OBU) when you drive through the gantry.
- For vehicles with non-local registered IUs, you can drive in by tapping or inserting your Autopass Card on the card reader at the gantry booth.

2. Guests taking Sentosa Express into the island via VivoCity Station:

- Guests with EZ-Link Cards, bank cards (Visa, Mastercard, Amex): Tap in at the gate and the island admission fee will be automatically deducted.
- Guests without EZ-Link Cards: Purchase the island admission ticket from VivoCity Station ticketing counter or via [Sentosa online store](https://www.sentosa.com.sg/en/things-to-do/attractions/sentosa-express). Proceed to the gate and scan the QR code found on the admission ticket.

How can I enjoy complimentary island admission?

You can continue to enjoy free island admission by travelling into the island on foot via Sentosa Boardwalk, by cycling, and SBS Transit’s Service 123 (only distance-based bus fare applies). Islander members on either the Insider or Priority tier will enjoy complimentary island admission.

I am an Islander member. How can I enjoy complimentary island admission?

Islander members on either the Insider or Priority tier will enjoy complimentary island admission.

Instructions for use:

1. Guests entering the island via the Sentosa Gateway (Personal Vehicle):

- Log in to your membership account and update your vehicle number and IU/OBU number under your profile to have your vehicle registered for complimentary entry.
- Please note that at least 24 hours is required for activation. Once activated, you may drive through the gantry auto-lanes to enjoy the complimentary entry.

2. Guests entering the island via the Sentosa Gateway (Taxi/ Private hire):

- Log in to your membership account to retrieve your membership QR code. Scan the QR code on the QR reader at the gantry booth.
- Alternatively, enter via gantry Lane 1 or 2 (far left) at the Sentosa Gateway if you require assistance.
- Please remind the driver to remove the CashCard from the in-vehicle/on-board unit (IU/OBU) before approaching the Sentosa gantry.

3. Guests taking Sentosa Express via VivoCity Station:

- Log in to your membership account to retrieve your membership QR code. Scan the QR code at the Sentosa Express gate.

Members are recommended to log in to their Islander account via MySentosa mobile app to access the QR code.

I have a QR code that allows complimentary island admission. How do I go about using it?

Guests may be issued with a QR code that grants free island admission for selected private events and hotel/long term stays within Sentosa.

Instructions for use:

1. Guests entering the island via the Sentosa Gateway (Personal Vehicle):

- Scan the island admission QR code on the QR reader at the gantry booth.
- Please be reminded to remove the CashCard from your in-vehicle/on-board unit (IU/OBU) before approaching the Sentosa gantry.

2. Guests entering the island via the Sentosa Gateway (Taxi/ Private hire):

- Scan the island admission QR code on the QR reader at the gantry booth.
- Alternatively, enter via gantry Lane 1 or 2 (far left) at the Sentosa Gateway if you require assistance.
- Please remind the driver to remove the CashCard from the in-vehicle/on-board unit (IU/OBU) before approaching the Sentosa gantry.

3. Guests taking Sentosa Express into the island via VivoCity Station:

- Scan the island admission QR code at the Sentosa Express gate.

Note that the validity period of each QR code varies and will only be usable for a limited time. For more information on the QR code issued or if you encounter any issues with the QR code (including expired QR code), please check with the respective event organiser, hotel or business in which you had obtained the QR code from.

The QR code scanner at the auto lanes doesn’t work. What should I do?

The QR code scanner is located on the left side of the terminal station. If you encounter issues scanning the QR code, try to adjust the brightness on your mobile device and fit the QR code into the scanner again. Should you require further assistance, press on the Intercom button and our staff will assist you.

I am a driver of a private-hire vehicle/ taxi, entering Sentosa to drop-off/ pick-up my passengers. Will I be charged the island admission fee?

**For drop-off :** You may drive through the gantry auto-lanes and the applicable island admission fees will be automatically deducted via the CashCard inserted in your in-vehicle/on-board unit (IU/OBU).

**For pick-up :** If you have a valid ride booking, you must enter via gantry Lane 1 or 2 (far left) at the Sentosa Gateway. Our staff at the gantry lane will verify the documents prior to giving a waiver of the island admission fee.

I am a driver of a Goods and Services vehicle, entering Sentosa to deliver orders. Will I be charged the island admission fee?

If you have a valid delivery or purchase order, you must enter via gantry Lane 1 or 2 (far left) at the Sentosa Gateway. Our staff at the gantry lane will verify the documents prior to giving a waiver of the island admission fee.

I forgot to remove my CashCard before approaching the gantry. How can I get a refund of the island admission fee?

Guests are strongly encouraged to remove the CashCard from the in-vehicle/on-board unit (IU/OBU) before approaching the Sentosa gantry. Otherwise, the applicable island admission fee will be automatically deducted when you drive through the gantry auto-lanes.

All requests will be reviewed on a case-to-case basis. You may approach our staff at the Gantry Guest Services booth for assistance or submit your request via our [Online Feedback Form](https://www.sentosa.com.sg/en/contact-us/) along with the date & time of entry, your vehicle number and IU number.

Travelling to Sentosa

Island Admissions- How do I make payment if I am driving in or taking a taxi into the island?

Island admission (IA) fees are deducted from the in-vehicle/on-board unit (IU/OBU). Guests coming in by taxi will pay for the IA charges which will be included in the taxi fare at the end of the ride.

When we come in a large group, will we be able to enjoy discount in the island admission tickets?

Please be informed that there is no discount in island admission ticket.

What transport can I take to get around the island?

You may take the Sentosa Bus, Sentosa Express, Beach Trams or Sentosa Line (Cable Car). Please click [here](https://www.sentosa.com.sg/en/getting-around) for more information on the operating hours and routes.

What are the different modes of entry into Sentosa Island?

Sentosa is accessible by Sentosa Express, Singapore Cable Car, taxis, cars, coaches or by foot. Please click [here](https://www.sentosa.com.sg/en/getting-to-sentosa) for more information on the island admission charges and operating hours.

Do I have to purchase a ticket to use the internal transportation?

You can travel for FREE within the island with the Sentosa Bus, Sentosa Express, and Beach Trams.

Can I cycle into Sentosa or enter Sentosa using my Personal Mobility Device (PMD)?

Please be informed that Personal Mobility Devices (PMD) are not allowed on Sentosa Boardwalk and Sentosa roads for safety reasons. You may wish to enter the island with your PMD folded while on board any of the Sentosa transportations (Sentosa Express and Sentosa Bus A & B).

Cyclists are able to enter the island via the cycling track along the Sentosa Boardwalk. You may refer more information on the [cycling trails in Sentosa](https://www.sentosa.com.sg/en/get-inspired/sentosa-guides/the-ultimate-guide-to-cycling-around-sentosa/).

Attractions & Island Partners

Does my child require a ticket to visit the attractions?

Entry requirements for children vary across attractions, including but not limited to, specific age limits, height and weight restrictions. Visit [Sentosa Online Store](https://www.sentosa.com.sg/en/shop/) and check the respective product details page if your child needs a ticket or is eligible for free admission before making your purchase.

Would I be able to purchase island admission and attraction tickets online?

Yes, you may purchase tickets and vouchers from **[Sentosa Online Store](https://www.sentosa.com.sg/en/shop/)**.

Alternatively, you may also buy the tickets at any Sentosa Station Ticketing Counter, located at VivoCity Level 3 on your day of visit.

What is defined as "Local" tickets?

Local tickets are applicable only to Singapore Citizens, Permanent Residents (PRs), and guests with a valid local residential address, including holders of Employment Passes, Work Permits, or Dependent Passes. Guests must be prepared to present valid proof of eligibility at the point of ticket purchase and/or during random checks at the entrance. Those who are unable to provide the necessary documentation will be required to top up to the full published price or may be denied entry.

What attractions, dining options, and experiences can I book on Sentosa.com?

You can purchase tickets, and book a variety of attractions, dining experiences, accommodations, wellness activities, and tours directly on Sentosa.com.

### **Attractions**

Enjoy thrilling rides, immersive experiences, and scenic adventures at:

- Adventure Cove Waterpark
- Albatross Speedboat Adventures
- Axe Factor
- DinoVenture: A Virtual Reality Experience
- Gogreen Eco Adventure @ St John’s Island
- iFly Singapore
- Madame Tussauds Singapore
- Mega Adventure Park
- MelodyBel Yacht Charter Service
- Nestopia
- Ola Beach Club
- Scentopia
- S.E.A. Aquarium
- Sentosa 4D AdventureLand
- Sentosa Express
- Singapore Cable Car
- SkyHelix Sentosa
- SkyPark Sentosa by AJ Hackett
- YachtCruiseSG Seringat Ferry
- Universal Studios Singapore
- Wings of Time Fireworks Symphony

### **Dining**

Savour diverse cuisines at top restaurants and beach clubs, including:

- 1-Altitude Coast
- Arbora Café
- Bedrock Origin
- Camille
- Coastes
- Co+Nut+Ink
- Feng Shui Inn
- Food Kiosk at Central Beach Bazaar
- Gold Old Days Food Court
- Kwee Zeen
- Le Bar
- Le Faubourg
- Marrybrown
- MIYOSHI by Fat Cow
- Native Kitchen
- Ocean Restaurant
- Ola Beach Club
- Osia Steak and Seafood Grill
- Royal Taj Sentosa
- Sabio by the Sea
- SKIRT
- Soi Social
- Sol & Ora
- Summerhouse Beach Club
- The Cliff
- the kitchen table
- Wildseed Bar & Grill
- Wildseed Café
- WOOBAR

### **Hotels & Stays**

Book a relaxing getaway at:

- Amara Sanctuary Sentosa
- W Singapore – Sentosa Cove

### **Spa & Wellness**

- My Queen – a luxurious wellness retreat

### **Passes & Vouchers**

- Fun Discovery Pass
- Food Discovery Pass
- Sentosa Gift Voucher

### **Events & Tours**

Join unique experiences like:

- A Taste of Time Travel: Back to 1870s (Fort Serapong)
- Escape from St John's Island
- Fort Siloso Night Experience
- Harry Potter: Visions of Magic
- Immersive Rainforest Trails
- Introduction to Birdwatching
- Sentosa Intertidal Exploration
- Sentosa Kayaking Trail
- Sentosa Naturalist Night Adventure
- Sentosa Sunset Cruise
- Serapong Trail

Discover and book your next adventure at [Sentosa.com](https://www.sentosa.com.sg/en/shop/).

Can I film or take wedding photos on Sentosa?

Filming and photo shoots for personal use are allowed on Sentosa without a permit. However, a permit is required for commercial or corporate shoots. For clarifications or permit applications, please [contact us](https://www.sentosa.com.sg/en/contact-us).

Are there any restricted areas for filming and photography on Sentosa?

Some areas, such as Tanjong Rimau (Siloso Headland) and Mount Serapong, are important biodiversity sites.

A permit is required for research studies, photography, filming, or other activities in these nature areas. For enquiries about research studies, photography, or filming in Sentosa's nature areas, email [nature@sentosa.com.sg](mailto:nature@sentosa.com.sg) with details of your request, including intended date of visit, purpose, and location.

For immediate assistance during your visit, please call **1800-RANGERS (1800-726 4377)**.

Where can I get more information on Resorts World at Sentosa?

You can get information at this [website](http://www.rwsentosa.com/).

Facilities

Are there any access-friendly facilities and amenities?

We are committed to ensuring that the Sentosa experience is accessible and enjoyable for all visitors. You can find access-friendly entrances, lift(s), & facilities at:

**Attractions**

|     |                           |
| --- | ------------------------- |
| 1   | Fort Siloso Skywalk       |
| 2   | Sentosa Nature Discovery  |
| 3   | Go Green Kiosk\*          |
| 4   | Wings of Time\*           |
| 5   | Palawan Kidz City         |
| 6   | Madame Tussauds Singapore |
| 7   | Skypark by AJ Hackett     |
| 8   | iFly                      |
| 9   | Skyline Luge Sentosa      |
| 10  | Nestopia                  |

**F&B**

|     |                    |
| --- | ------------------ |
| 1   | Good Old Days\*    |
| 2   | Trapizza           |
| 3   | Rumours Beach Club |
| 4   | Ola Beach Club     |
| 5   | Coastes            |
| 6   | FOC Sentosa        |
| 7   | Tanjong Beach Club |

**Hotels**

|     |                                         |
| --- | --------------------------------------- |
| 1   | Sofitel Singapore Sentosa Resort & Spa  |
| 2   | Oasia Resort Sentosa                    |
| 3   | Amara Sanctuary Sentosa                 |
| 4   | The Outpost Hotel Sentosa               |
| 5   | Village Hotel Sentosa                   |
| 6   | Capella Singapore & The Club Residences |
| 7   | Shangri-La Rasa Sentosa, Singapore      |
| 8   | Siloso Beach Resort                     |
| 9   | Resorts World Sentosa                   |
| 10  | W Hotel Singapore                       |

**Sentosa Cove**

|     |                                      |
| --- | ------------------------------------ |
| 1   | Sentosa Cove Village                 |
| 2   | ONE°15 Marina Sentosa Cove Singapore |
| 3   | Quayside Isle                        |

**Facilities**

|     |                                                                           |
| --- | ------------------------------------------------------------------------- |
| 1   | Beach Toilets (Siloso West, Siloso East, Palawan East)                    |
| 2   | Pavilions (Sapphire, Emerald)                                             |
| 3   | Sentosa Express Stations (VivoCity, Resorts World, Imbiah, Beach Station) |
| 4   | Cablecar Stations (Sensoryscape, Siloso Point, Imbiah Lookout)            |
| 5   | Sentosa Boardwalk                                                         |

\\\* At least one accessible entrance into building, without accessible toilet

Are there any Automated Teller Machines (ATM) in Sentosa?

ATMs are located at the following locations:

\- Sentosa Golf Club (DBS)

\- Quayside Isle (DBS)

\- Resorts World Sentosa

Is there free WiFi available in Sentosa?

Yes! Stay connected throughout the island with **SENTOSA FREE WIFI**. Simply select the network on your device and start exploring with seamless connectivity.

Are there any nursing rooms in Sentosa?

Yes, they are located at designated areas on island. You may approach our ground staff for directions to the nearest nursing room

We are pleased to share that there are 5 lactation pods for breastfeeding mothers across Sentosa in partnership with Go!mama- Two pods have been set up at Sentosa Express (Resorts World Station) and one pod each at Beach Station bus interchange, Siloso Beach and Palawan Beach. The freestanding booths incorporate innovative features like automated cleaning and disinfection and secured access control via Singpass or a One-Time Password.

Are there any prayer rooms in Sentosa?

There are dedicated prayer spaces to express devotions in privacy and peace for guests of all faiths and nationalities.

**Locations:**

- Beach Station, B1 (Daily; 9am to 10pm)
- Resorts World Sentosa, Galleria, Level 2

Do I have to pay to use the restroom and shower facilities at the beaches?

You may enjoy complimentary usage of our public restrooms and shower facilities along the beaches.

Are baby prams and/or wheelchair rental services available in Sentosa?

Wheelchair rental service is available at Beach Station or Sensoryscape Guest Services Counter. Visit [here](https://www.sentosa.com.sg/en/things-to-do/shops-and-services/wheelchair-rental-service/) for more information. However, baby pram rental service is not available.

Are there any barbeque pits in Sentosa? Can I bring my own portable barbeque pits?

There are no public barbeque pits in Sentosa. For the safety of our beach-goers, outdoor barbeque grills, charcoal burners, and open-flame cooking devices are not permitted on the beaches.

Where can guest top up their CashCards?

Guests can top up their CashCards at Beach Station or at the Gantry Guest Services booth (after Sentosa Gantry).

Where can I find lockers in Sentosa?

Lockers are can be found at the restrooms along our beaches (Siloso, Palawan & Tanjong). They are available from 7am to 8pm for guests to store small to medium-sized baggage.

Small locker: 355(h) x 305(w) x 495(d) mm - $6 per 24hrs

Big Locker 890(h) x 460(w) x 495(d) mm - $12 per 24hrs

\*A new day rental will be charged after the subsequent 24hrs.

Are there money changers in the island?

There is a money changer in the Cable Car Retail Outlet located at Imbiah Lookout. (Note: Indian rupees and Philippine pesos are not available for exchange).

Money changing service is also available at Resorts World Sentosa, VivoCity and HarbourFront Centre.

Food & Beverages

Are there any Halal certified food outlets in Sentosa?

Halal certified food outlets are available on the island and are marked with the Halal logo on our island map. Please download a copy of our island map [here](https://www.sentosa.com.sg/en/get-inspired/sentosa-discovery-guide/).

Alternatively, you can visit **[this page to find out more.](https://www.sentosa.com.sg/en/get-inspired/sentosa-discovery-guide/)**

Where can I find more information on the food & beverage outlets available on the island?

You can visit the **[Dining section](https://www.sentosa.com.sg/en/things-to-do/dining)** of our website for more information on food & beverage outlets that are available on the island.

Load more topics +

[![](https://www.sentosa.com.sg/-/media/sentosa/icons/icon_ai_chatbot.svg?revision=0725a6f8-5717-42ba-a4b2-6e7191d3e19e)\\
\\
Chat](https://chat.sentosa.com.sg/#/chatview)

We use Cookies

By accessing and using our website, you agree to use our cookies

OK

VISIT SENTOSA

[About us](https://www.sentosa.com.sg/en/about-us/) [Contact us](https://www.sentosa.com.sg/en/contact-us/) [Getting to](https://www.sentosa.com.sg/en/getting-to-sentosa/) [Getting around](https://www.sentosa.com.sg/en/getting-around/) [Accessibility](https://www.sentosa.com.sg/en/sentosa-accessibility/) [Sentosa Discovery Squad](https://www.sentosa.com.sg/sentosadiscoverysquad) [FAQ](https://www.sentosa.com.sg/en/faqs/?type=visit-sentosa)

ISLANDER MEMBERSHIP

[Sign up](https://www.sentosa.com.sg/en/account/signup/?membership=premium) [Islander benefits](https://www.sentosa.com.sg/en/membership/islander/) [FAQ](https://www.sentosa.com.sg/en/faqs/?type=islander-membership)

CORPORATE

[Careers](https://www.sentosa.com.sg/en/careers/) [Our corporate site](https://www.sentosa.gov.sg/) [Sustainable Sentosa](https://www.sentosa.gov.sg/what-we-do/sustainable-sentosa/overview)

FOLLOW US

[Facebook](https://www.facebook.com/sentosaofficial "Facebook")[Instagram](https://www.instagram.com/sentosa_island/ "Instagram")[TikTok](https://www.tiktok.com/@sentosa_island "TikTok")[Youtube](https://www.youtube.com/user/SentosaTV "Youtube")[Weibo](http://www.weibo.com/sentosasingapore "Weibo")[WeChat](https://www.wechat.com/en/ "WeChat")[Xiaohongshu](https://www.xiaohongshu.com/user/profile/65bb0f6c000000000d01ca7b "Xiaohongshu")[Telegram](https://t.me/sentosaisland "Telegram")[LinkedIn](https://www.linkedin.com/company/sentosa-development-corporation/about/ "LinkedIn")[Twitter](https://twitter.com/Sentosa_Island "Twitter")

[Legal](https://www.sentosa.com.sg/en/legal-information/) [Report vulnerability](https://www.tech.gov.sg/report_vulnerability) [Data protection policy](https://www.sentosa.com.sg/en/data-protection-policy/)

©Sentosa 2025. All rights reserved.

[iframe](https://insight.adsrvr.org/track/cei?advertiser_id=r1y9ajl&cookie_sync=1&upv=3.0.0&upid=8hmkbpd&ref=https://www.sentosa.com.sg/en/faqs)
```

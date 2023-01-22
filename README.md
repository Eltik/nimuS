# nimuS
A lightweight anime storage solution inspired by [Sumin](https://api.sumin.moe).

## Disclaimer
The idea of nimuS (as the name suggests) is quite literally the same as Sumin, but with a different implementation. I am not affiliated with Sumin at the moment, and if the owners wish for me to take this project down I will do so. Please visit them at https://sumin.moe/.

## How it Works
nimuS scrapes [Nyaa.si](https://nyaa.si) for torrents and maps each torrent to AniList. This allows for searching directly on AniList for shows and then immediately streaming on Nyaa for raws, subbed, or dubbed content. Also, since torrenting downloads files locally, people can now host storage servers similar to GogoAnime and Zoro. To elaborate, nimuS works by creating a torrent stream which requires storing the torrent locally. A timeout can be set to automatically delete the file after a certain amount of time, thus creating a temporary stream that won't take up too much space.
<img width="1512" alt="image" src="https://user-images.githubusercontent.com/76538547/213894624-07d5750a-de1b-4b7c-a1e8-80bdb6a5df31.png">

## Installation
Clone the GitHub repository and run `npm i`.
```bash
$ git clone https://github.com/Eltik/nimuS.git
$ npm i
```
You can start the nimuS playground by running `npm run start`.
```bash
$ npm run start
```

## Documentation
TBD

## Contribution
nimuS is still a work-in-progress and is not even close to being done, so contribution would very much be appreciated. Please open a [Pull Request](https://github.com/Eltik/nimuS/pulls) if you would like to contribute.
